import type { ReactNode } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { Card } from './Card';

export function StatCard({
  label,
  value,
  note,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  note: string;
  icon: ReactNode;
  tone?: 'neutral' | 'success' | 'warning';
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="muted text-xs font-semibold uppercase tracking-[0.12em]">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <ArrowUpRight
              weight="bold"
              className={
                tone === 'warning' ? 'text-[var(--rr-warning)]' : 'text-[var(--rr-success)]'
              }
            />
            <span className="muted">{note}</span>
          </div>
        </div>
        <div className="rounded-xl bg-accent-soft p-3 text-accent">{icon}</div>
      </div>
    </Card>
  );
}
