import { Barcode, Printer, QrCode, WarningCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export function BarcodesPage() {
  const [batch, setBatch] = useState('');
  const [created, setCreated] = useState(false);
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Barcode center"
        title="Generate, print and validate labels"
        description="Code 128 is the default machine-readable format. The human-readable identifier is always printed next to the barcode."
        actions={<Button icon={<Printer size={17} />}>Open print queue</Button>}
      />
      <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <Card>
          <div className="flex items-center gap-3">
            <Barcode size={22} className="text-accent" />
            <div>
              <p className="text-sm font-semibold">Create barcode batch</p>
              <p className="muted text-xs">Generate labels for a validated file range.</p>
            </div>
          </div>
          <input
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            placeholder="RF-0000124587 to RF-0000124687"
            className="focus-ring mt-5 h-11 w-full rounded-xl border border-base bg-[var(--rr-bg)] px-3 font-mono text-xs outline-none"
          />
          <div className="mt-4 flex gap-2">
            <Button onClick={() => setCreated(true)} icon={<Barcode size={17} />}>
              Generate preview
            </Button>
            <Button variant="ghost" icon={<Printer size={17} />}>
              Queue print
            </Button>
          </div>
          {created && (
            <div className="mt-4 rounded-xl bg-accent-soft p-4 text-sm">
              <p className="font-semibold text-accent">Preview generated</p>
              <p className="muted mt-1 text-xs">
                This frontend simulates a 100-label batch. Production will generate deterministic
                barcode payloads server-side.
              </p>
            </div>
          )}
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold">Label anatomy</p>
            <Badge tone="info">Code 128</Badge>
          </div>
          <div className="rounded-xl border border-base p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">Record file</p>
            <p className="mt-2 font-mono text-lg font-bold">RF-0000124587</p>
            <div className="mt-4 h-16 rounded bg-[repeating-linear-gradient(90deg,#16232c_0_2px,transparent_2px_5px,#16232c_5px_6px,transparent_6px_9px)]" />
            <p className="mt-4 text-xs">File No. ABC/2021/4587</p>
            <p className="muted mt-1 text-[10px]">Revenue · 2021 · 25 year retention</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[var(--rr-bg)] p-3">
              <QrCode className="text-accent" size={18} />
              <p className="mt-2 text-xs font-semibold">QR supported</p>
              <p className="muted mt-1 text-[10px]">Useful for camera-based mobile scanning.</p>
            </div>
            <div className="rounded-xl bg-[var(--rr-bg)] p-3">
              <WarningCircle className="text-[var(--rr-warning)]" size={18} />
              <p className="mt-2 text-xs font-semibold">Replacement audited</p>
              <p className="muted mt-1 text-[10px]">
                Reprints never silently create a new identity.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
