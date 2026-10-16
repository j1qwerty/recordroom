import { useEffect, useId, useState } from 'react';
import { ArrowDown, Eye, UploadSimple, X } from '@phosphor-icons/react';
import {
  describePageCount,
  documentAcceptAttribute,
  formatDocumentSize,
  pdfPageFragment,
  validateDocumentFile,
} from '../lib/document';
import type { Result } from '../services/contracts';

interface Props {
  filename: string;
  version?: number;
  hasDocument: boolean;
  contentType?: string;
  sizeBytes?: number;
  /** Pages in a stored PDF; undefined/null means unknown and is left unlabelled. */
  pageCount?: number;
  /** 1-based page inside a multi-page PDF that this row represents. */
  pageIndex?: number;
  canUpload: boolean;
  onUpload(file: File): Promise<Result<unknown>>;
  getBlob(): Promise<Blob>;
  onUploaded?: () => void;
}

/** Reusable upload/preview/download controls for record attachments, page scans and maps. */
export function DocumentUploadActions({
  filename,
  version,
  hasDocument,
  contentType,
  sizeBytes,
  pageCount,
  pageIndex,
  canUpload,
  onUpload,
  getBlob,
  onUploaded,
}: Props) {
  const inputId = useId();
  const [selected, setSelected] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState(contentType ?? '');

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const upload = async () => {
    const issue = validateDocumentFile(selected);
    if (issue || !selected) {
      setMessage({ tone: 'danger', text: issue ?? 'Choose a document to upload.' });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const result = await onUpload(selected);
      if (!result.ok) {
        setMessage({ tone: 'danger', text: result.error });
        return;
      }
      setSelected(null);
      const input = document.getElementById(inputId) as HTMLInputElement | null;
      if (input) input.value = '';
      setMessage({
        tone: 'success',
        text: 'Document uploaded as a new version. Previous versions are retained.',
      });
      onUploaded?.();
    } catch (error) {
      setMessage({
        tone: 'danger',
        text: error instanceof Error ? error.message : 'Document upload failed.',
      });
    } finally {
      setUploading(false);
    }
  };

  const openPreview = async () => {
    setOpening(true);
    setMessage(null);
    try {
      const blob = await getBlob();
      const type = blob.type || contentType || inferType(filename);
      const typed = blob.type ? blob : new Blob([blob], { type });
      const url = URL.createObjectURL(typed);
      // A row inside a multi-page PDF opens on its own page, not page 1.
      const target = `${url}${type === 'application/pdf' ? pdfPageFragment(pageIndex) : ''}`;
      setPreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return target;
      });
      setPreviewType(type);
    } catch (error) {
      setMessage({
        tone: 'danger',
        text: error instanceof Error ? error.message : 'Could not open this document.',
      });
    } finally {
      setOpening(false);
    }
  };

  const download = async () => {
    setOpening(true);
    setMessage(null);
    try {
      const blob = await getBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename || 'scanned-document';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setMessage({
        tone: 'danger',
        text: error instanceof Error ? error.message : 'Could not download this document.',
      });
    } finally {
      setOpening(false);
    }
  };

  const isPdf = previewType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf');
  const isImage = previewType.startsWith('image/') || /\.(jpe?g|png|gif)$/i.test(filename);
  const pages = describePageCount(pageCount);

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {version !== undefined && (
          <span className="rounded-md border border-base px-2 py-1 text-[10px] font-semibold">
            v{version}
          </span>
        )}
        {hasDocument ? (
          <>
            <button
              type="button"
              onClick={() => void openPreview()}
              disabled={opening}
              className="focus-ring inline-flex items-center gap-1 rounded-lg border border-base px-2.5 py-1.5 text-xs font-semibold hover:bg-surface-muted disabled:opacity-50"
            >
              <Eye size={14} /> {opening ? 'Opening…' : 'Preview'}
            </button>
            <button
              type="button"
              onClick={() => void download()}
              disabled={opening}
              className="focus-ring inline-flex items-center gap-1 rounded-lg border border-base px-2.5 py-1.5 text-xs font-semibold hover:bg-surface-muted disabled:opacity-50"
            >
              <ArrowDown size={14} /> Download
            </button>
            {sizeBytes !== undefined && (
              <span className="muted text-[11px]">
                {formatDocumentSize(sizeBytes)}
                {pages && ' · ' + pages}
              </span>
            )}
          </>
        ) : (
          <span className="muted text-[11px]">No document uploaded for this row yet</span>
        )}
      </div>

      {canUpload && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={inputId}>
            Choose PDF or image
          </label>
          <input
            id={inputId}
            type="file"
            accept={documentAcceptAttribute()}
            onChange={(event) => setSelected(event.target.files?.[0] ?? null)}
            className="block max-w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-accent-soft file:px-2 file:py-1.5 file:font-semibold file:text-accent"
          />
          <button
            type="button"
            onClick={() => void upload()}
            disabled={!selected || uploading}
            className="focus-ring inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            <UploadSimple size={14} /> {uploading ? 'Uploading…' : 'Upload new version'}
          </button>
        </div>
      )}

      {message && (
        <p
          role="status"
          className={'text-xs ' + (message.tone === 'danger' ? 'text-danger' : 'text-success')}
        >
          {message.text}
        </p>
      )}

      {previewUrl && (
        <div className="overflow-hidden rounded-xl border border-base">
          <div className="flex items-center justify-between gap-3 border-b border-base px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{filename}</p>
              <p className="muted text-[10px]">
                {isPdf ? 'PDF preview' : isImage ? 'Image preview' : previewType}
                {pages && ' · ' + pages}
                {isPdf && pageIndex && pageIndex > 1 && ` · showing page ${pageIndex}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              aria-label="Close preview"
              className="focus-ring rounded-md p-1 hover:bg-surface-muted"
            >
              <X size={15} />
            </button>
          </div>
          {isPdf ? (
            <iframe
              title={'Preview ' + filename}
              src={previewUrl}
              className="h-[60vh] min-h-[360px] w-full bg-white"
            />
          ) : isImage ? (
            <div className="max-h-[60vh] overflow-auto bg-surface-muted p-3 text-center">
              <img
                src={previewUrl}
                alt={filename}
                className="mx-auto h-auto max-w-full object-contain"
              />
            </div>
          ) : (
            <p className="muted p-4 text-xs">
              This format cannot be previewed in the browser. Use Download.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function inferType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  return '';
}
