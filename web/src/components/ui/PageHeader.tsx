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
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 max-w-3xl">
        {kicker && <p className="mb-1 text-sm font-semibold text-accent">{kicker}</p>}
        <h1 className="text-2xl font-bold tracking-[-0.02em] md:text-3xl">{title}</h1>
        {description && <p className="muted mt-2 max-w-2xl text-sm leading-6">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
