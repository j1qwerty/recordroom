import { describe, expect, it } from 'vitest';
import {
  describePageCount,
  documentAcceptAttribute,
  formatDocumentSize,
  MAX_DOCUMENT_BYTES,
  pdfPageFragment,
  validateDocumentFile,
} from '../src/lib/document';

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
    expect(validateDocumentFile(doc({ name: 'scan.tiff', type: 'image/tiff' }))).toMatch(
      /only pdf/i,
    );
    expect(validateDocumentFile(doc({ name: 'scan.pdf', type: 'image/png' }))).toMatch(
      /does not match/i,
    );
  });

  it('enforces the configured default ceiling and emits an input accept filter', () => {
    expect(validateDocumentFile(doc({ size: MAX_DOCUMENT_BYTES }))).toBeNull();
    expect(validateDocumentFile(doc({ size: MAX_DOCUMENT_BYTES + 1 }))).toMatch(/48 mib/i);
    expect(documentAcceptAttribute()).toContain('.pdf');
    expect(documentAcceptAttribute()).toContain('.png');
  });

  it('keeps the ceiling under the 50M the reverse proxy allows', () => {
    // nginx rejects anything over 50M with an opaque 413 before the API is
    // reached, so the client ceiling must sit below it or large A0 scans fail
    // with no useful message.
    expect(MAX_DOCUMENT_BYTES).toBeLessThan(50 * 1024 * 1024);
  });

  it('formats metadata sizes', () => {
    expect(formatDocumentSize(300)).toBe('300 B');
    expect(formatDocumentSize(2048)).toBe('2.0 KiB');
    expect(formatDocumentSize(1_572_864)).toBe('1.5 MiB');
  });
});

describe('multi-page PDF metadata', () => {
  it('describes single and multi-page documents', () => {
    expect(describePageCount(1)).toBe('1 page');
    expect(describePageCount(2)).toBe('2 pages');
    expect(describePageCount(1250)).toBe('1,250 pages');
  });

  it('leaves an unreadable page count unlabelled rather than claiming one page', () => {
    // Encrypted PDFs and object-stream page trees cannot be counted. Showing
    // "1 page" there would be a lie, so the label is omitted entirely.
    expect(describePageCount(undefined)).toBe('');
    expect(describePageCount(null)).toBe('');
    expect(describePageCount(Number.NaN)).toBe('');
  });

  it('builds a PDF page fragment only for a valid 1-based page', () => {
    expect(pdfPageFragment(1)).toBe('#page=1');
    expect(pdfPageFragment(7)).toBe('#page=7');
    expect(pdfPageFragment(0)).toBe('');
    expect(pdfPageFragment(undefined)).toBe('');
    expect(pdfPageFragment(null)).toBe('');
  });
});
