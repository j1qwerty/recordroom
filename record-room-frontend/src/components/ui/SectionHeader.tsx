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
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl">{title}</h2>
        {description && <p className="muted mt-2 max-w-3xl text-sm leading-6">{description}</p>}
      </div>
      {action}
    </div>
  );
}
