import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-[var(--rr-surface-2)] text-[var(--rr-text)]',
    success: 'bg-[color-mix(in_srgb,var(--rr-success)_14%,transparent)] text-[var(--rr-success)]',
    warning: 'bg-[color-mix(in_srgb,var(--rr-warning)_14%,transparent)] text-[var(--rr-warning)]',
    danger: 'bg-[color-mix(in_srgb,var(--rr-danger)_14%,transparent)] text-[var(--rr-danger)]',
    info: 'bg-accent-soft text-accent',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
