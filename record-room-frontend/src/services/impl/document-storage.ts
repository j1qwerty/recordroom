import { err, ok } from '../contracts';
import type { RecordFileDocument } from '../../types';
import { validateDocumentFile } from '../../lib/document';
import { newId, timestamp } from '../store';
import { session } from './session';

/** Local/demo-mode document bytes only live for this browser session. Use the .NET API for durable storage. */
const blobs = new Map<string, Blob>();
const recordDocuments = new Map<string, RecordFileDocument[]>();

export interface LocalDocumentInfo {
  contentType: string;
  sizeBytes: number;
  sha256: string;
  /** Pages in a stored PDF; undefined means the count could not be read. */
  pageCount?: number;
}

const mimeByExtension: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
};

/**
 * Reads a PDF page count the same way the API does, by scanning the raw bytes for
 * the page tree. This is a demo-mode hint, not a guarantee: anything unreadable
 * returns undefined so the UI omits the page label rather than claiming one page.
 */
async function countPdfPages(file: File): Promise<number | undefined> {
  try {
    const bytes = new Uint8Array(await file.slice(0, 32 * 1024 * 1024).arrayBuffer());
    let text = '';
    for (let at = 0; at < bytes.length; at += 0x8000) {
      text += String.fromCharCode(...bytes.subarray(at, Math.min(at + 0x8000, bytes.length)));
    }
    if (!text.startsWith('%PDF-')) return undefined;

    let total = 0;
    for (const node of text.match(/\/Type\s*\/Pages[^>]*?\/Count\s+(\d+)/g) ?? []) {
      const count = Number(/\/Count\s+(\d+)/.exec(node)?.[1] ?? '0');
      if (count > 0) total += count;
    }
    if (total > 0) return total;

    const leaves = text.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
    return leaves && leaves.length > 0 ? leaves.length : undefined;
  } catch {
    return undefined;
  }
}

export function localDocumentInfo(file: File): LocalDocumentInfo {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return { contentType: mimeByExtension[extension] ?? file.type, sizeBytes: file.size, sha256: '' };
}

async function documentInfo(file: File): Promise<LocalDocumentInfo> {
  const info = localDocumentInfo(file);
  if (info.contentType !== 'application/pdf') return info;
  return { ...info, pageCount: await countPdfPages(file) };
}

export function listLocalRecordDocuments(fileId: string): RecordFileDocument[] {
  return [...(recordDocuments.get(fileId) ?? [])].sort((a, b) => b.version - a.version);
}

export async function addLocalRecordDocument(fileId: string, barcode: string, file: File) {
  const issue = validateDocumentFile(file);
  if (issue) return err<RecordFileDocument>(issue, 'document');
  const info = await documentInfo(file);
  const rows = recordDocuments.get(fileId) ?? [];
  const row: RecordFileDocument = {
    id: newId('document'),
    fileId,
    fileBarcode: barcode,
    version: rows.reduce((max, item) => Math.max(max, item.version), 0) + 1,
    filename: file.name,
    contentType: info.contentType,
    sizeBytes: info.sizeBytes,
    sha256: info.sha256,
    uploadedAt: timestamp(),
    uploadedBy: session.userName(),
  };
  recordDocuments.set(fileId, [...rows, row]);
  blobs.set(blobKey('record', row.id), new Blob([file], { type: info.contentType }));
  return ok(row);
}

export async function saveLocalRowDocument(
  scope: 'page' | 'map',
  id: string,
  file: File,
): Promise<LocalDocumentInfo> {
  const issue = validateDocumentFile(file);
  if (issue) throw new Error(issue);
  const info = await documentInfo(file);
  blobs.set(blobKey(scope, id), new Blob([file], { type: info.contentType }));
  return info;
}

export function localDocumentBlob(scope: 'record' | 'page' | 'map', id: string): Blob {
  const blob = blobs.get(blobKey(scope, id));
  if (!blob) throw new Error('This scan has no stored document bytes in local demo mode.');
  return blob;
}

export function localRecordDocumentBlob(fileId: string, documentId: string): Blob {
  const belongsToRecord = (recordDocuments.get(fileId) ?? []).some(
    (item) => item.id === documentId,
  );
  if (!belongsToRecord) throw new Error('Document not found for this record.');
  return localDocumentBlob('record', documentId);
}

export function clearLocalDocumentStorage(): void {
  blobs.clear();
  recordDocuments.clear();
}

function blobKey(scope: 'record' | 'page' | 'map', id: string): string {
  return `${scope}:${id}`;
}
