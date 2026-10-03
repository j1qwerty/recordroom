import type { ReactNode } from 'react';

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {kicker && (
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {kicker}
          </div>
        )}
        <h1 className="text-3xl font-semibold tracking-[-0.04em] md:text-4xl">{title}</h1>
        {description && <p className="muted mt-3 max-w-2xl text-sm leading-6">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
