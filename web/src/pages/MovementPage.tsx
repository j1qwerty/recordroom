import { useState, type ReactNode } from 'react';
import {
  ArrowsClockwise,
  Clock,
  MagnifyingGlass,
  Scan,
  WarningCircle,
} from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SelectInput, TextInput } from '../components/ui/Field';
import { EmptyState } from '../components/ui/EmptyState';
import { Flash } from '../components/ui/Flash';
import { useService, useQuery } from '../hooks/useService';
import { formatNumber } from '../lib/utils';
import type { MovementKind, MovementEvent, IssueRecord } from '../types';

const EMPTY_MOVEMENTS: MovementEvent[] = [];
const EMPTY_ISSUES: IssueRecord[] = [];

const KINDS: Array<MovementKind | 'All'> = [
  'All',
  'Issue',
  'Return',
  'Location change',
  'Digitization',
  'File created',
  'Relocation',
];

const KIND_TONE: Record<MovementKind, 'success' | 'warning' | 'info' | 'neutral'> = {
  Issue: 'warning',
  Return: 'success',
  'Location change': 'info',
  Digitization: 'info',
  'File created': 'neutral',
  Relocation: 'neutral',
};

/**
 * Movement log driven by the events the write services append.
 *
 * Nothing here is hardcoded: issuing a file on the issue desk or relocating one
 * from its detail page shows up here immediately. Both reads are async, so the
 * filters drive `useQuery` deps and the rows render once the service answers.
 */
export function MovementPage() {
  const service = useService();

  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<MovementKind | 'All'>('All');

  const { data: rows, loading } = useQuery(
    () => service.movements.list({ search, kind, limit: 200 }),
    [search, kind],
    EMPTY_MOVEMENTS,
    // Any write produces a movement event; this is the live log.
    ['movements'],
  );
  // Overdue receipts and the unfiltered total do not depend on the filters above,
  // so they are asked for once rather than on every keystroke.
  const { data: overdue } = useQuery(() => service.issues.overdue(), [], EMPTY_ISSUES, ['issues']);
  const { data: allEvents } = useQuery(
    () => service.movements.list({ limit: 10_000 }),
    [],
    EMPTY_MOVEMENTS,
  );
  const todayCount = rows.filter(
    (row) => row.at.slice(0, 10) === new Date().toISOString().slice(0, 10),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Traceability"
        title="Movement log"
        description="A chronological record of issue, return, relocation and digitization events, written in the same transaction as the change itself."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Mini
          icon={<Scan />}
          label="Events in view"
          value={formatNumber(rows.length)}
          note="Filtered"
        />
        <Mini
          icon={<ArrowsClockwise />}
          label="Events today"
          value={formatNumber(todayCount)}
          note="Since midnight"
        />
        <Mini
          icon={<Clock />}
          label="Overdue receipts"
          value={formatNumber(overdue.length)}
          note="Needs follow-up"
          tone="warning"
        />
      </section>

      <Card padding={false} className="overflow-hidden">
        <div className="grid gap-3 border-b border-base p-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative">
            <MagnifyingGlass
              className="muted absolute left-3.5 top-1/2 -translate-y-1/2"
              size={17}
            />
            <TextInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Barcode, subject, actor, from or to…"
              className="pl-10"
              aria-label="Search movement log"
            />
          </div>
          <SelectInput
            value={kind}
            onChange={(event) => setKind(event.target.value as MovementKind | 'All')}
            aria-label="Filter by movement kind"
          >
            {KINDS.map((item) => (
              <option key={item} value={item}>
                {item === 'All' ? 'All movement kinds' : item}
              </option>
            ))}
          </SelectInput>
        </div>

        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={loading ? 'Loading movement events' : 'No movement events match'}
              description={
                loading
                  ? 'Asking the registry for the events that match these filters.'
                  : 'Clear the filters, or issue a file from the issue desk to see a new event appear here.'
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--rr-border)]">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid gap-4 p-5 lg:grid-cols-[1.1fr_.9fr_1fr_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs text-accent">{row.fileBarcode}</p>
                  <p className="mt-2 text-sm font-semibold">{row.subject}</p>
                  <p className="muted mt-1 text-[11px] leading-5">{row.detail}</p>
                </div>
                <div>
                  <p className="muted text-[10px] uppercase tracking-wider">From</p>
                  <p className="mt-1 text-xs">{row.from}</p>
                </div>
                <div>
                  <p className="muted text-[10px] uppercase tracking-wider">To</p>
                  <p className="mt-1 text-xs">{row.to}</p>
                </div>
                <div className="flex flex-col items-start gap-2 lg:items-end">
                  <Badge tone={KIND_TONE[row.kind]}>{row.kind}</Badge>
                  <span className="text-[11px] muted">{row.at}</span>
                  <span className="text-[11px] muted">by {row.actor}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {overdue.length > 0 && (
        <Flash
          tone="danger"
          text={`${overdue.length} receipt(s) are past their due date: ${overdue
            .map((issue) => issue.receiptNumber)
            .join(', ')}.`}
        />
      )}

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <WarningCircle className="text-accent" size={18} />
          <p className="text-sm font-semibold">How this log is produced</p>
        </div>
        <p className="muted text-sm leading-6">
          {allEvents.length} events exist in the local dataset. Every issue, return, relocation,
          file creation and digitization release appends one row inside the same write that changes
          the record, so the log cannot disagree with the registry. The full history for 25 lakh
          files belongs in the API with server-side pagination.
        </p>
      </Card>
    </div>
  );
}

function Mini({
  icon,
  label,
  value,
  note,
  tone = 'neutral',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  tone?: 'neutral' | 'warning';
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div
          className={`rounded-lg p-2 ${tone === 'warning' ? 'text-[var(--rr-warning)]' : 'text-accent'}`}
          style={
            tone === 'warning'
              ? { background: 'color-mix(in srgb, var(--rr-warning) 12%, transparent)' }
              : undefined
          }
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold">{label}</p>
          <p className="mt-1 text-xl font-semibold">{value}</p>
          <p className="muted text-[10px]">{note}</p>
        </div>
      </div>
    </Card>
  );
}
