import { ArchiveTray } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Card } from './Card';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex min-h-52 flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-full bg-accent-soft p-4 text-accent">
        <ArchiveTray size={26} />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="muted mt-2 max-w-md text-sm leading-6">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
