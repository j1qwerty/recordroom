import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { DotsThreeVertical } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';

/**
 * Overflow menu rendered in a portal.
 *
 * Tables sit inside `overflow-x-auto`, which also clips vertically, so an
 * absolutely positioned menu would be cut off on the last rows. The portal
 * positions itself from the trigger's rectangle and flips upward near the
 * bottom of the viewport.
 */
export function RowMenu({
  label,
  children,
  className,
  trigger,
}: {
  label: string;
  children: (close: () => void) => ReactNode;
  className?: string;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const rect = button.current.getBoundingClientRect();
    const width = 232;
    const up = window.innerHeight - rect.bottom < 240 && rect.top > 240;
    setPos({
      top: up ? rect.top - 6 : rect.bottom + 6,
      left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
      up,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !button.current?.contains(target)) close();
    };
    const key = (event: KeyboardEvent) => event.key === 'Escape' && close();
    window.addEventListener('mousedown', away);
    window.addEventListener('keydown', key);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('mousedown', away);
      window.removeEventListener('keydown', key);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        className={cn(
          'focus-ring inline-flex items-center justify-center rounded-lg border border-base bg-[var(--rr-surface)] hover:bg-[var(--rr-surface-2)]',
          trigger ? 'min-h-11 gap-2 px-3 text-[13px] font-semibold' : 'size-9',
          className,
        )}
      >
        {trigger ?? <DotsThreeVertical size={18} weight="bold" />}
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={panel}
            role="menu"
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: 232,
              transform: pos.up ? 'translateY(-100%)' : undefined,
            }}
            className="surface animate-fade z-[70] rounded-xl p-1.5"
          >
            {children(close)}
          </div>,
          document.body,
        )}
    </>
  );
}

export const menuItemClass =
  'focus-ring flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm hover:bg-[var(--rr-surface-2)]';
