import { Funnel, ShieldCheck } from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const logs = [
  ['FILE_ISSUED', 'RF-0000123144', 'Operator 04', '09:18', 'Issue committed', 'warning'],
  ['LOCATION_VERIFIED', 'RF-0000177021', 'Operator 02', '10:16', 'Shelf scan matched', 'success'],
  ['BATCH_UPDATED', 'BATCH-041', 'Operator 07', '10:42', 'OCR queue resumed', 'info'],
  ['PERMISSION_CHECK', 'REPORT-228', 'Auditor 03', '11:03', 'Export permitted', 'default'],
];
export function AuditPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Governance"
        title="Audit log"
        description="Critical events should be append-only, timestamped, attributable and queryable by object, actor and action."
        actions={
          <Button variant="ghost" icon={<Funnel size={17} />}>
            Filters
          </Button>
        }
      />
      <Card padding={false} className="overflow-hidden">
        <div className="divide-y divide-[var(--rr-border)]">
          {logs.map(([action, object, actor, time, detail, tone]) => (
            <div
              key={`${action}-${object}`}
              className="grid gap-4 p-5 md:grid-cols-[1.3fr_1fr_1fr_auto] md:items-center"
            >
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-accent" />
                  <p className="font-mono text-xs font-semibold">{action}</p>
                </div>
                <p className="mt-2 text-xs muted">{detail}</p>
              </div>
              <div>
                <p className="muted text-[10px] uppercase tracking-wider">Object</p>
                <p className="mt-1 font-mono text-xs">{object}</p>
              </div>
              <div>
                <p className="muted text-[10px] uppercase tracking-wider">Actor</p>
                <p className="mt-1 text-xs">{actor}</p>
              </div>
              <div className="text-right">
                <Badge
                  tone={tone === 'default' ? 'neutral' : (tone as 'success' | 'warning' | 'info')}
                >
                  {time}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="rounded-2xl border border-base bg-accent-soft p-5">
        <p className="text-sm font-semibold">Security rule</p>
        <p className="muted mt-1 max-w-3xl text-sm leading-6">
          Do not treat frontend route guards as authorization. Production access must be enforced by
          backend policies on every data and document endpoint.
        </p>
      </div>
    </div>
  );
}
