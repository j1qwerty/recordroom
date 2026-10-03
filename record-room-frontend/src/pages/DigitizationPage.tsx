import { Archive, CheckCircle, Clock, FolderOpen, Plus, Scan } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { LinkButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const batches = [
  {
    id: '041',
    name: 'Revenue archive · Wave 04',
    total: 12500,
    done: 10040,
    ocr: 9850,
    qc: 9510,
    status: 'In progress',
    tone: 'info' as const,
  },
  {
    id: '040',
    name: 'Establishment · Pension files',
    total: 8000,
    done: 8000,
    ocr: 7992,
    qc: 7992,
    status: 'Complete',
    tone: 'success' as const,
  },
  {
    id: '039',
    name: 'Education grants · Legacy',
    total: 6000,
    done: 5200,
    ocr: 5044,
    qc: 4892,
    status: 'Quality review',
    tone: 'warning' as const,
  },
];

export function DigitizationPage() {
  return (
    <div className="relative space-y-7">
      <div className="pointer-events-none absolute -right-4 top-12 w-44 opacity-20">
        <img src="/decorative/geo-09.svg" alt="" className="w-full" />
      </div>
      <PageHeader
        kicker="Digitization"
        title="Scanning and OCR batches"
        description="Manage high-volume scanning, OCR, quality checks and reconciliation as asynchronous operational batches."
        actions={
          <LinkButton to="/digitization/041" icon={<Plus size={17} />}>
            New batch
          </LinkButton>
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={<Scan />} label="Scanned today" value="6,248" />
        <Metric icon={<Archive />} label="OCR complete" value="5,920" />
        <Metric icon={<CheckCircle />} label="QC passed" value="5,480" />
        <Metric icon={<Clock />} label="Exceptions" value="128" />
      </div>
      <Card padding={false} className="overflow-hidden">
        <div className="border-b border-base p-5">
          <p className="text-sm font-semibold">Active batches</p>
          <p className="muted mt-1 text-xs">Each batch can be paused, resumed and reconciled.</p>
        </div>
        <div className="divide-y divide-[var(--rr-border)]">
          {batches.map((batch) => (
            <div key={batch.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-accent">BATCH-{batch.id}</span>
                    <Badge tone={batch.tone}>{batch.status}</Badge>
                  </div>
                  <h2 className="mt-2 font-semibold">{batch.name}</h2>
                </div>
                <LinkButton
                  to={`/digitization/${batch.id}`}
                  variant="ghost"
                  icon={<FolderOpen size={16} />}
                >
                  Open batch
                </LinkButton>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Progress label="Scan" value={batch.done} total={batch.total} />
                <Progress label="OCR" value={batch.ocr} total={batch.total} />
                <Progress label="QC" value={batch.qc} total={batch.total} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
function Progress({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div className="rounded-xl bg-[var(--rr-bg)] p-3">
      <div className="flex justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className="muted">{pct}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[var(--rr-surface-2)]">
        <div className="h-full rounded-full bg-[var(--rr-accent)]" style={{ width: `${pct}%` }} />
      </div>
      <p className="muted mt-1 text-[10px]">
        {value.toLocaleString('en-IN')} / {total.toLocaleString('en-IN')}
      </p>
    </div>
  );
}
function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-accent-soft p-2 text-accent">{icon}</div>
        <div>
          <p className="muted text-[10px] uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-xl font-semibold">{value}</p>
        </div>
      </div>
    </Card>
  );
}
