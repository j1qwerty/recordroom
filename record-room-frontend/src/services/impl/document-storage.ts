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
}

const mimeByExtension: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
};

export function localDocumentInfo(file: File): LocalDocumentInfo {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return { contentType: mimeByExtension[extension] ?? file.type, sizeBytes: file.size, sha256: '' };
}

export function listLocalRecordDocuments(fileId: string): RecordFileDocument[] {
  return [...(recordDocuments.get(fileId) ?? [])].sort((a, b) => b.version - a.version);
}

export async function addLocalRecordDocument(
  fileId: string,
  barcode: string,
  file: File,
) {
  const issue = validateDocumentFile(file);
  if (issue) return err<RecordFileDocument>(issue, 'document');
  const info = localDocumentInfo(file);
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

export function saveLocalRowDocument(scope: 'page' | 'map', id: string, file: File): LocalDocumentInfo {
  const issue = validateDocumentFile(file);
  if (issue) throw new Error(issue);
  const info = localDocumentInfo(file);
  blobs.set(blobKey(scope, id), new Blob([file], { type: info.contentType }));
  return info;
}

export function localDocumentBlob(scope: 'record' | 'page' | 'map', id: string): Blob {
  const blob = blobs.get(blobKey(scope, id));
  if (!blob) throw new Error('This scan has no stored document bytes in local demo mode.');
  return blob;
}

export function localRecordDocumentBlob(fileId: string, documentId: string): Blob {
  const belongsToRecord = (recordDocuments.get(fileId) ?? []).some((item) => item.id === documentId);
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
