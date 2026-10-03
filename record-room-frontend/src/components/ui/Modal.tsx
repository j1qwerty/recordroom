import { X } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="surface w-full max-w-xl rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4 border-b border-base pb-4">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="focus-ring rounded-lg p-2 hover:bg-[var(--rr-surface-2)]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="pt-5">{children}</div>
      </div>
    </div>
  );
}
