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

export function documentAcceptAttribute(): string {
  return '.pdf,.jpg,.jpeg,.png,.gif,application/pdf,image/jpeg,image/png,image/gif';
}
