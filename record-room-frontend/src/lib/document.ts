export const MAX_DOCUMENT_BYTES = 512 * 1024 * 1024;

export interface DocumentFileLike {
  name: string;
  size: number;
  type: string;
}

/** Convenience validation before upload; the API repeats extension and signature checks. */
export function validateDocumentFile(file: DocumentFileLike | null): string | null {
  if (!file) return 'Choose a PDF or image file.';
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mimeByExtension: Record<string, string[]> = {
    pdf: ['application/pdf'],
    jpg: ['image/jpeg'],
    jpeg: ['image/jpeg'],
    png: ['image/png'],
    gif: ['image/gif'],
  };
  const validMimes = mimeByExtension[extension];
  if (!validMimes) return 'Only PDF, JPG, JPEG, PNG and GIF files are supported.';
  if (!Number.isFinite(file.size) || file.size <= 0) return 'The selected file is empty.';
  if (file.size > MAX_DOCUMENT_BYTES) return 'Files must be 512 MiB or smaller.';
  const mime = file.type.toLowerCase();
  if (mime && mime !== 'application/octet-stream' && !validMimes.includes(mime)) {
    return 'The selected file type does not match its extension.';
  }
  return null;
}

export function formatDocumentSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

/**
 * Describes a document's page span. A record-room scan is often one PDF covering
 * many pages, so the count is surfaced rather than hidden: `null` means the page
 * tree could not be read and must not be shown as a single page.
 */
export function describePageCount(pageCount?: number | null): string {
  if (pageCount === undefined || pageCount === null || !Number.isFinite(pageCount)) return '';
  if (pageCount <= 1) return '1 page';
  return `${pageCount.toLocaleString('en-IN')} pages`;
}

/**
 * Points a PDF preview at one page inside a multi-page document. Browsers honour
 * the `#page=` fragment, so a row can open the exact page it represents instead of
 * always showing page 1.
 */
export function pdfPageFragment(pageIndex?: number | null): string {
  if (pageIndex === undefined || pageIndex === null || !Number.isFinite(pageIndex)) return '';
  return pageIndex >= 1 ? `#page=${Math.trunc(pageIndex)}` : '';
}

export function documentAcceptAttribute(): string {
  return '.pdf,.jpg,.jpeg,.png,.gif,application/pdf,image/jpeg,image/png,image/gif';
}
