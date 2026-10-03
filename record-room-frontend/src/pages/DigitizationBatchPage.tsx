import { ArrowLeft, FileText, Pause, Play, WarningCircle } from '@phosphor-icons/react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function DigitizationBatchPage() {
  const { batchId } = useParams();
  return (
    <div className="space-y-6">
      <Link
        to="/digitization"
        className="inline-flex items-center gap-2 text-xs font-semibold muted"
      >
        <ArrowLeft size={15} /> All batches
      </Link>
      <PageHeader
        kicker={`BATCH-${batchId ?? '041'}`}
        title="Revenue archive · Wave 04"
        description="Detailed operational view for scanning, OCR, metadata validation and reconciliation."
        actions={
          <>
            <Button variant="ghost" icon={<Pause size={16} />}>
              Pause
            </Button>
            <Button icon={<Play size={16} />}>Resume processing</Button>
          </>
        }
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <p className="muted text-[10px] uppercase tracking-wider">Items</p>
          <p className="mt-2 text-3xl font-semibold">12,500</p>
          <p className="muted mt-1 text-xs">10,040 scanned</p>
        </Card>
        <Card>
          <p className="muted text-[10px] uppercase tracking-wider">OCR</p>
          <p className="mt-2 text-3xl font-semibold">9,850</p>
          <p className="muted mt-1 text-xs">2,690 remaining</p>
        </Card>
        <Card>
          <p className="muted text-[10px] uppercase tracking-wider">QC</p>
          <p className="mt-2 text-3xl font-semibold">9,510</p>
          <p className="muted mt-1 text-xs">95.2% of scanned items</p>
        </Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <div className="flex items-center gap-2">
            <FileText className="text-accent" />
            <p className="text-sm font-semibold">Pipeline</p>
          </div>
          <div className="mt-5 space-y-4">
            {[
              ['Scan', 80],
              ['OCR', 78],
              ['Metadata', 72],
              ['QC', 76],
            ].map(([label, pct]) => (
              <div key={String(label)}>
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">{String(label)}</span>
                  <span className="muted">{String(pct)}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[var(--rr-surface-2)]">
                  <div
                    className="h-full rounded-full bg-[var(--rr-accent)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <WarningCircle className="text-[var(--rr-warning)]" />
            <p className="text-sm font-semibold">Exceptions</p>
          </div>
          <div className="mt-5 space-y-3">
            {['14 unreadable scans', '26 metadata mismatches', '88 duplicate references'].map(
              (item) => (
                <div key={item} className="rounded-xl bg-[var(--rr-bg)] p-3">
                  <p className="text-xs font-semibold">{item}</p>
                  <button className="mt-2 text-[10px] font-semibold text-accent">Open queue</button>
                </div>
              ),
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
