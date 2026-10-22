import { useId, useState, type DragEvent } from 'react';
import { FileArrowUp, FilePdf, X } from '@phosphor-icons/react';
import { documentAcceptAttribute, formatDocumentSize } from '../../lib/document';
import { cn } from '../../lib/utils';

/** Tap-or-drop file picker for scans. Validation is the caller's job. */
export function DropZone({
  file,
  onFile,
  disabled,
  hint = 'PDF, JPG, PNG or GIF · up to 48 MiB',
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
  hint?: string;
}) {
  const id = useId();
  const [over, setOver] = useState(false);

  const drop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    if (disabled) return;
    onFile(event.dataTransfer.files?.[0] ?? null);
  };

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-base bg-[var(--rr-bg)] p-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
          <FilePdf size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{file.name}</p>
          <p className="muted text-xs">{formatDocumentSize(file.size)}</p>
        </div>
        <button
          type="button"
          onClick={() => onFile(null)}
          disabled={disabled}
          className="focus-ring grid size-10 place-items-center rounded-lg hover:bg-[var(--rr-surface-2)] disabled:opacity-50"
          aria-label="Remove selected file"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <label
      htmlFor={id}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
      className={cn(
        'focus-within:outline-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition',
        over
          ? 'border-[var(--rr-accent)] bg-accent-soft'
          : 'border-base bg-[var(--rr-bg)] hover:border-[var(--rr-accent)]',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <FileArrowUp size={30} className="text-accent" />
      <span className="text-sm font-semibold">Choose a scan or drop it here</span>
      <span className="muted text-xs">{hint}</span>
      <input
        id={id}
        type="file"
        accept={documentAcceptAttribute()}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}
