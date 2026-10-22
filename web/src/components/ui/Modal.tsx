import { X } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useEffect, useId } from 'react';
import { cn } from '../../lib/utils';

const widths = { md: 'sm:max-w-xl', lg: 'sm:max-w-3xl', xl: 'sm:max-w-5xl' };

/**
 * Dialog on desktop, bottom sheet on phones.
 *
 * The body scrolls on its own so a long form or a PDF preview never pushes the
 * title bar or the footer off screen, and the page behind is locked while open.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof widths;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="animate-fade fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/55 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className={cn(
          'animate-sheet surface flex max-h-[92dvh] w-full flex-col rounded-t-2xl sm:max-h-[88dvh] sm:rounded-2xl',
          widths[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-base px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold leading-snug">
              {title}
            </h2>
            {description && <p className="muted mt-1 text-sm leading-5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring -mr-2 grid size-10 shrink-0 place-items-center rounded-lg hover:bg-[var(--rr-surface-2)]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="pb-safe flex flex-col-reverse gap-2 border-t border-base px-5 pt-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
