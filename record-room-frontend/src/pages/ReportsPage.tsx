import { ChartBar, DownloadSimple, FilePdf, FileXls, Funnel } from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const reports = [
  ['Files by room', 'Current physical inventory grouped by site, building, floor and room.'],
  ['Issue / return report', 'User-wise issue, return, overdue and custody status.'],
  ['Shelf occupancy', 'Capacity and approximate occupancy at shelf level.'],
  ['Retention / disposal', 'Records reaching configured retention milestones.'],
  ['Digitization progress', 'Batch-level scan, OCR and quality-control throughput.'],
  ['Missing / exception files', 'Records without verified location or with movement exceptions.'],
];

export function ReportsPage() {
  return (
    <div className="relative space-y-7">
      <div className="pointer-events-none absolute right-0 top-0 w-40 opacity-20">
        <img src="/decorative/geo-10.svg" alt="" className="w-full" />
      </div>
      <PageHeader
        kicker="Reporting"
        title="Reports & dashboards"
        description="Exports should run as background jobs for large datasets so reporting does not block operational traffic."
        actions={
          <Button variant="ghost" icon={<Funnel size={17} />}>
            Filters
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="Reports available" value="24" />
        <Kpi label="Scheduled" value="8" />
        <Kpi label="Export jobs today" value="42" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map(([title, description]) => (
          <Card key={title}>
            <div className="flex items-start justify-between gap-4">
              <div className="rounded-lg bg-accent-soft p-2 text-accent">
                <ChartBar size={18} />
              </div>
              <span className="rounded-full bg-[var(--rr-surface-2)] px-2 py-1 text-[10px] muted">
                Ready
              </span>
            </div>
            <h2 className="mt-4 text-sm font-semibold">{title}</h2>
            <p className="muted mt-2 text-xs leading-6">{description}</p>
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" className="flex-1" icon={<FileXls size={16} />}>
                Excel
              </Button>
              <Button variant="ghost" className="flex-1" icon={<FilePdf size={16} />}>
                PDF
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">Report governance</p>
            <p className="muted mt-1 text-xs leading-6">
              Production report exports should enforce the caller's data scope and preserve an audit
              event for generated files.
            </p>
          </div>
          <Button variant="ghost" icon={<DownloadSimple size={16} />}>
            Open export history
          </Button>
        </div>
      </Card>
    </div>
  );
}
function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="muted text-[10px] uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Card>
  );
}
