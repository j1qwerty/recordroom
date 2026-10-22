import type { ReactNode } from 'react';

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-sm font-semibold text-accent">{eyebrow}</p>}
        <h2 className="text-xl font-bold tracking-[-0.02em] md:text-2xl">{title}</h2>
        {description && <p className="muted mt-1.5 max-w-3xl text-sm leading-6">{description}</p>}
      </div>
      {action}
    </div>
  );
}
