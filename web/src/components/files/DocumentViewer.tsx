import { useEffect, useState } from 'react';
import { ArrowSquareOut, DownloadSimple, WarningCircle } from '@phosphor-icons/react';
import { pdfPageFragment } from '../../lib/document';
import { Button } from '../ui/Button';

interface ViewerState {
  key: string;
  url: string | null;
  type: string;
  error: string | null;
}

function inferType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  return '';
}

/**
 * Fetches one stored document and shows it inline.
 *
 * `docKey` identifies the document: change it and the previous object URL is
 * revoked and the new blob is fetched. Loading is derived from the key instead
 * of being set in the effect, which keeps the effect free of synchronous
 * state writes.
 */
export function DocumentViewer({
  docKey,
  load,
  filename,
  contentType,
  pageIndex,
}: {
  docKey: string;
  load: () => Promise<Blob>;
  filename: string;
  contentType?: string;
  pageIndex?: number;
}) {
  const [state, setState] = useState<ViewerState>({ key: '', url: null, type: '', error: null });

  useEffect(() => {
    let live = true;
    let created: string | null = null;
    load().then(
      (blob) => {
        if (!live) return;
        const type = blob.type || contentType || inferType(filename);
        const typed = blob.type ? blob : new Blob([blob], { type });
        created = URL.createObjectURL(typed);
        setState({ key: docKey, url: created, type, error: null });
      },
      (cause: unknown) => {
        if (!live) return;
        setState({
          key: docKey,
          url: null,
          type: '',
          error: cause instanceof Error ? cause.message : 'Could not load this document.',
        });
      },
    );
    return () => {
      live = false;
      if (created) URL.revokeObjectURL(created);
    };
    // `load` closes over the same ids that make up `docKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey]);

  const loading = state.key !== docKey;
  const isPdf = state.type === 'application/pdf';
  const isImage = state.type.startsWith('image/');
  const src = state.url ? `${state.url}${isPdf ? pdfPageFragment(pageIndex) : ''}` : null;

  const download = () => {
    if (!state.url) return;
    const anchor = document.createElement('a');
    anchor.href = state.url;
    anchor.download = filename || 'document';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  if (loading) {
    return (
      <div
        role="status"
        className="grid h-[50dvh] place-items-center rounded-xl border border-base bg-[var(--rr-bg)] text-sm muted"
      >
        <span className="flex items-center gap-2.5">
          <span className="size-2 animate-pulse rounded-full bg-[var(--rr-accent)]" />
          Opening {filename}…
        </span>
      </div>
    );
  }

  if (state.error || !src) {
    return (
      <div
        role="alert"
        className="flex h-[40dvh] flex-col items-center justify-center gap-2 rounded-xl border border-base bg-[var(--rr-bg)] p-6 text-center"
      >
        <WarningCircle size={28} className="text-[var(--rr-danger)]" />
        <p className="text-sm font-semibold">This document could not be opened</p>
        <p className="muted max-w-sm text-sm">{state.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-base bg-[var(--rr-bg)]">
        {isPdf ? (
          <iframe
            title={`Preview of ${filename}`}
            src={src}
            className="h-[58dvh] w-full bg-white"
          />
        ) : isImage ? (
          <div className="max-h-[58dvh] overflow-auto p-2 text-center">
            <img src={src} alt={filename} className="mx-auto h-auto max-w-full object-contain" />
          </div>
        ) : (
          <p className="muted p-6 text-sm">
            This format cannot be previewed in the browser. Use Download instead.
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={download} icon={<DownloadSimple size={16} />}>
          Download
        </Button>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-lg border border-base bg-[var(--rr-surface)] px-3 text-[13px] font-semibold hover:bg-[var(--rr-surface-2)]"
        >
          <ArrowSquareOut size={16} /> Open in new tab
        </a>
      </div>
    </div>
  );
}
