import { ArrowsClockwise, Clock, MapPin, Scan, UserCircle } from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import type { ReactNode } from 'react';
import { dashboardEvents } from '../data/mock';

export function MovementPage() {
  const rows = [
    {
      id: 'm1',
      rf: 'RF-0000123144',
      action: 'Issued',
      from: 'RM-004 / A-011 / S-03',
      to: 'R. Kumar · Establishment',
      when: '09:18',
      tone: 'warning' as const,
    },
    {
      id: 'm2',
      rf: 'RF-0000177021',
      action: 'Location verified',
      from: 'RM-004 / A-010 / S-02',
      to: 'RM-004 / A-010 / S-02',
      when: '10:16',
      tone: 'success' as const,
    },
    {
      id: 'm3',
      rf: 'RF-0000199103',
      action: 'Moved to digitization',
      from: 'RM-005 / A-013 / S-01',
      to: 'Digitization Desk',
      when: '10:45',
      tone: 'info' as const,
    },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Traceability"
        title="Movement log"
        description="A chronological record of issue, return, transfer, verification and digitization movements."
      />
      <Card padding={false} className="overflow-hidden">
        <div className="border-b border-base p-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone="info">Today · 24 events</Badge>
            <Badge>All departments</Badge>
            <Badge>All operators</Badge>
          </div>
        </div>
        <div className="divide-y divide-[var(--rr-border)]">
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid gap-4 p-5 lg:grid-cols-[1.1fr_.8fr_1fr_auto] lg:items-center"
            >
              <div>
                <p className="font-mono text-xs text-accent">{row.rf}</p>
                <p className="mt-2 text-sm font-semibold">{row.action}</p>
              </div>
              <div>
                <p className="muted text-[10px] uppercase tracking-wider">From</p>
                <p className="mt-1 text-xs">{row.from}</p>
              </div>
              <div>
                <p className="muted text-[10px] uppercase tracking-wider">To</p>
                <p className="mt-1 text-xs">{row.to}</p>
              </div>
              <div className="text-xs muted">{row.when}</div>
            </div>
          ))}
        </div>
      </Card>
      <section className="grid gap-5 md:grid-cols-3">
        <Mini icon={<Scan />} label="Scanner events" value="1,824" note="Today" />
        <Mini icon={<ArrowsClockwise />} label="Moves" value="68" note="Today" />
        <Mini icon={<Clock />} label="Overdue returns" value="12" note="Action needed" />
      </section>
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <UserCircle className="text-accent" />
          <p className="text-sm font-semibold">Latest operational signals</p>
        </div>
        <div className="space-y-3">
          {dashboardEvents.slice(0, 3).map((event) => (
            <div key={event.id} className="flex items-start gap-3 rounded-xl bg-[var(--rr-bg)] p-3">
              <MapPin size={16} className="mt-0.5 text-accent" />
              <div>
                <p className="text-xs font-semibold">{event.label}</p>
                <p className="muted mt-1 text-xs">{event.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
function Mini({
  icon,
  label,
  value,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-accent-soft p-2 text-accent">{icon}</div>
        <div>
          <p className="text-xs font-semibold">{label}</p>
          <p className="mt-1 text-xl font-semibold">{value}</p>
          <p className="muted text-[10px]">{note}</p>
        </div>
      </div>
    </Card>
  );
}
