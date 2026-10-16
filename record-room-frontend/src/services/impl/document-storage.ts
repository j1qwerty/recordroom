import type { RecordFileDocument } from '../../types';
import { validateDocumentFile } from '../../lib/document';
import { newId, timestamp } from '../store';
import { session } from './session';

/** Local/demo-mode content is kept in browser memory only. Use the .NET API for persistence. */
const blobs = new Map<string, Blob>();
const recordDocuments = new Map<string, RecordFileDocument[]>();

const mimeByExtension: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
};

/**
 * Reads a PDF page count the same way the API does, by scanning the raw bytes for
 * the page tree. It is a demo-mode hint, not a guarantee: anything unreadable
 * returns undefined so the UI leaves the count unlabelled rather than claiming 1.
 */
function countPdfPages(file: File): Promise<number | undefined> {
  return file
    .slice(0, 32 * 1024 * 1024)
    .arrayBuffer()
    .then((buffer) => {
      let text = '';
      const bytes = new Uint8Array(buffer);
      const step = 0x8000;
      for (let at = 0; at < bytes.length; at += step) {
        text += String.fromCharCode(...bytes.subarray(at, Math.min(at + step, bytes.length)));
      }
      if (!text.startsWith('%PDF-')) return undefined;
      let total = 0;
      const nodes = text.match(/\/Type\s*\/Pages[^>]*?\/Count\s+(\d+)/g) ?? [];
      for (const node of nodes) {
        const count = Number(/\/Count\s+(\d+)/.exec(node)?.[1] ?? '0');
        if (count > 0) total += count;
      }
      if (total > 0) return total;
      const leaves = text.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
      return leaves && leaves.length > 0 ? leaves.length : undefined;
    })
    .catch(() => undefined);
}

export function listLocalRecordDocuments(fileId: string): RecordFileDocument[] {
  return [...(recordDocuments.get(fileId) ?? [])].sort((a, b) => b.version - a.version);
}

export async function addLocalRecordDocument(fileId: string, barcode: string, file: File) {
  const issue = validateDocumentFile(file);
  if (issue) return { ok: false as const, error: issue, field: 'document' };
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const contentType = mimeByExtension[extension] ?? file.type;
  const rows = recordDocuments.get(fileId) ?? [];
  const row: RecordFileDocument = {
    id: newId('document'),
    fileId,
    fileBarcode: barcode,
    version: rows.reduce((max, item) => Math.max(max, item.version), 0) + 1,
    filename: file.name,
    contentType,
    sizeBytes: file.size,
    sha256: '',
    uploadedAt: timestamp(),
    uploadedBy: session.userName(),
    pageCount: contentType === 'application/pdf' ? await countPdfPages(file) : undefined,
  };
  recordDocuments.set(fileId, [...rows, row]);
  blobs.set(blobKey('record', row.id), new Blob([file], { type: contentType }));
  return { ok: true as const, value: row };
}

export async function saveLocalRowDocument(scope: 'page' | 'map', id: string, file: File) {
  const issue = validateDocumentFile(file);
  if (issue) throw new Error(issue);
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const contentType = mimeByExtension[extension] ?? file.type;
  blobs.set(blobKey(scope, id), new Blob([file], { type: contentType }));
  const pageCount = contentType === 'application/pdf' ? await countPdfPages(file) : undefined;
  return { contentType, sizeBytes: file.size, sha256: '', pageCount };
}

export function localDocumentBlob(scope: 'record' | 'page' | 'map', id: string): Blob {
  const blob = blobs.get(blobKey(scope, id));
  if (!blob) throw new Error('This scan has no document bytes in local demo mode.');
  return blob;
}

export function localRecordDocumentBlob(fileId: string, documentId: string): Blob {
  if (!(recordDocuments.get(fileId) ?? []).some((item) => item.id === documentId)) {
    throw new Error('Document not found for this record.');
  }
  return localDocumentBlob('record', documentId);
}

export function clearLocalDocumentStorage(): void {
  blobs.clear();
  recordDocuments.clear();
}

function blobKey(scope: 'record' | 'page' | 'map', id: string): string {
  return `${scope}:${id}`;
}
