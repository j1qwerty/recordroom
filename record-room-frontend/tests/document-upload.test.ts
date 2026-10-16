import { describe, expect, it } from 'vitest';
import { documentAcceptAttribute, formatDocumentSize, MAX_DOCUMENT_BYTES, validateDocumentFile } from '../src/lib/document';

const doc = (patch: Partial<{ name: string; size: number; type: string }> = {}) => ({
  name: 'scan.pdf',
  size: 1024,
  type: 'application/pdf',
  ...patch,
});

describe('scanned document upload validation', () => {
  it('allows PDFs and legacy image formats', () => {
    expect(validateDocumentFile(doc())).toBeNull();
    expect(validateDocumentFile(doc({ name: 'map.JPG', type: 'image/jpeg' }))).toBeNull();
    expect(validateDocumentFile(doc({ name: 'scan.png', type: 'image/png' }))).toBeNull();
    expect(validateDocumentFile(doc({ name: 'scan.gif', type: 'image/gif' }))).toBeNull();
  });

  it('rejects empty input, unsupported types and misleading MIME types', () => {
    expect(validateDocumentFile(null)).toMatch(/choose/i);
    expect(validateDocumentFile(doc({ size: 0 }))).toMatch(/empty/i);
    expect(validateDocumentFile(doc({ name: 'scan.tiff', type: 'image/tiff' }))).toMatch(/only pdf/i);
    expect(validateDocumentFile(doc({ name: 'scan.pdf', type: 'image/png' }))).toMatch(/does not match/i);
  });

  it('enforces the configured default ceiling and emits an input accept filter', () => {
    expect(validateDocumentFile(doc({ size: MAX_DOCUMENT_BYTES }))).toBeNull();
    expect(validateDocumentFile(doc({ size: MAX_DOCUMENT_BYTES + 1 }))).toMatch(/512 mib/i);
    expect(documentAcceptAttribute()).toContain('.pdf');
    expect(documentAcceptAttribute()).toContain('.png');
  });

  it('formats metadata sizes', () => {
    expect(formatDocumentSize(300)).toBe('300 B');
    expect(formatDocumentSize(2048)).toBe('2.0 KiB');
    expect(formatDocumentSize(1_572_864)).toBe('1.5 MiB');
  });
});
