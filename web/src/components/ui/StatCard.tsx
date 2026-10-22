import type { ReactNode } from 'react';
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
        <div className="min-w-0">
          <p className="muted text-sm font-medium">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.03em]">{value}</p>
          <p
            className={`mt-2 text-xs ${tone === 'warning' ? 'text-[var(--rr-warning)]' : 'muted'}`}
          >
            {note}
          </p>
        </div>
        <div className="rounded-xl bg-accent-soft p-2.5 text-accent">{icon}</div>
      </div>
    </Card>
  );
}
