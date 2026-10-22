import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function Card({
  children,
  className,
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div className={cn('surface-flat rounded-2xl', padding && 'p-5', className)}>{children}</div>
  );
}
