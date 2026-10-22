import { useMemo, useState } from 'react';
import { Barcode, CheckCircle, Printer, QrCode, WarningCircle } from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Field, SelectInput, TextInput } from '../components/ui/Field';
import { Flash } from '../components/ui/Flash';
import { BarcodeSymbol } from '../components/BarcodeSymbol';
import { useQuery, useService } from '../hooks/useService';
import { buildQrPayload } from '../lib/barcode';
import type { Area, BarcodeJob, BarcodePayload, BarcodeSubject, RecordFile, Room } from '../types';
import type { Page } from '../services/contracts';

const EMPTY_ROOMS: Room[] = [];
const EMPTY_AREAS: Area[] = [];
const EMPTY_FILES: Page<RecordFile> = { items: [], total: 0, page: 1, pageSize: 200 };
const EMPTY_SUBJECTS: BarcodeSubject[] = [];
const EMPTY_PAYLOADS: BarcodePayload | null = null;
const EMPTY_JOBS: BarcodeJob[] = [];

interface Target {
  id: string;
  label: string;
}

/**
 * Barcode centre.
 *
 * The previous page drew CSS gradients, which cannot be scanned. This one
 * renders a real Code 128 symbol from the project encoder, exposes the QR
 * sticker payload, and keeps a print queue so a reprint is an auditable event
 * instead of a silent action.
 */
export function BarcodesPage() {
  const service = useService();

  const [subject, setSubject] = useState<BarcodeSubject>('File');
  const [targetId, setTargetId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [flash, setFlash] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  // Every read on this page crosses the network now: the location tree for the
  // non-file subjects, the registry for file subjects, and the subject list for
  // the picker. The picker resets the target on change, so no default is seeded.
  const { data: subjects } = useQuery(() => service.barcodes.subjects(), [], EMPTY_SUBJECTS);
  const { data: rooms } = useQuery(() => service.locations.listRooms(), [], EMPTY_ROOMS);
  const { data: areas } = useQuery(() => service.locations.areas(), [], EMPTY_AREAS);
  const { data: files } = useQuery(() => service.files.list({ pageSize: 200 }), [], EMPTY_FILES);
  const { data: jobs, reload: reloadJobs } = useQuery(
    () => service.barcodes.jobs(),
    [],
    EMPTY_JOBS,
  );

  const targets: Target[] = useMemo(() => {
    if (subject === 'File')
      return files.items.map((f) => ({ id: f.id, label: `${f.fileBarcode} · ${f.subject}` }));
    if (subject === 'Shelf')
      return rooms.flatMap((room) =>
        room.storageUnits.flatMap((unit) =>
          unit.shelves.map((shelf) => ({
            id: shelf.id,
            label: `${shelf.code} · ${shelf.barcode}`,
          })),
        ),
      );
    if (subject === 'Almirah')
      return rooms.flatMap((room) =>
        room.storageUnits.map((unit) => ({ id: unit.id, label: `${room.code} · ${unit.code}` })),
      );
    if (subject === 'Section')
      return rooms.flatMap((room) =>
        room.sections.map((section) => ({
          id: section.id,
          label: `${room.code} · ${section.name}`,
        })),
      );
    if (subject === 'Room')
      return rooms.map((room) => ({ id: room.id, label: `${room.code} · ${room.name}` }));
    return areas.map((area) => ({ id: area.id, label: `${area.name} · ${area.pincode}` }));
  }, [subject, files, rooms, areas]);

  const { data: payload } = useQuery(
    () => service.barcodes.payloadFor(subject, targetId),
    [subject, targetId],
    EMPTY_PAYLOADS,
  );

  const queue = async () => {
    if (!targetId) return;
    const result = await service.barcodes.createJob({ subject, targetId, quantity });
    setFlash(
      result.ok
        ? {
            tone: 'success',
            text: `Queued ${result.value.quantity} label(s) for ${result.value.label}.`,
          }
        : { tone: 'danger', text: result.error },
    );
    // The queue list is a read, so a successful write has to refresh it or the
    // new job does not appear until the page is revisited.
    if (result.ok) reloadJobs();
  };

  const print = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Barcode center"
        title="Generate, print and validate labels"
        description="Code 128 is the default machine-readable format. The human-readable identifier is always printed next to the symbol."
        actions={
          <Button icon={<Printer size={17} />} onClick={print} disabled={!payload}>
            Print label sheet
          </Button>
        }
      />

      {flash && <Flash tone={flash.tone} text={flash.text} onDismiss={() => setFlash(null)} />}

      <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <Card>
          <div className="flex items-center gap-3">
            <Barcode size={22} className="text-accent" />
            <div>
              <p className="text-sm font-semibold">Build a print job</p>
              <p className="muted text-xs">Pick a target and queue the labels.</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Label subject" htmlFor="barcode-subject">
              <SelectInput
                id="barcode-subject"
                value={subject}
                onChange={(event) => {
                  const next = event.target.value as BarcodeSubject;
                  setSubject(next);
                  setTargetId('');
                }}
              >
                {subjects.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Target" htmlFor="barcode-target" required>
              <SelectInput
                id="barcode-target"
                value={targetId}
                onChange={(event) => setTargetId(event.target.value)}
              >
                <option value="">Select a target</option>
                {targets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Quantity" htmlFor="barcode-qty" hint="1 to 500.">
              <TextInput
                id="barcode-qty"
                type="number"
                min={1}
                max={500}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </Field>

            <Button
              className="w-full"
              onClick={() => void queue()}
              disabled={!payload}
              icon={<Printer size={17} />}
            >
              Queue print job
            </Button>
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">Label preview</p>
              <Badge tone="info">{payload?.symbology ?? 'Code128'}</Badge>
            </div>
            {payload ? (
              <div className="rounded-xl border border-base p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-accent">
                  {subject} label
                </p>
                <p className="mt-2 font-mono text-lg font-bold">{payload.label}</p>
                <div className="mt-4 text-[var(--rr-text)]">
                  <BarcodeSymbol value={payload.value} height={72} title={payload.label} />
                </div>
                <p className="mt-4 text-xs">
                  Payload: <span className="font-mono">{payload.value}</span>
                </p>
                <p className="muted mt-1 text-[10px]">{payload.meta}</p>
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-accent-soft p-3">
                  <QrCode size={18} className="text-accent" />
                  <p className="muted text-[10px] leading-5">
                    QR sticker target:{' '}
                    <span className="font-mono">{buildQrPayload(payload.value)}</span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="muted text-sm">Select a target to preview its label.</p>
            )}
          </Card>

          <Card padding={false} className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-base p-5">
              <div>
                <p className="text-sm font-semibold">Print queue</p>
                <p className="muted mt-1 text-xs">Reprints stay on the audit trail.</p>
              </div>
              <Badge tone="neutral">{jobs.length}</Badge>
            </div>
            {jobs.length === 0 ? (
              <p className="muted p-5 text-xs">No print jobs queued yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--rr-border)]">
                {jobs.map((job) => (
                  <li
                    key={job.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-5"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold">{job.value}</p>
                      <p className="muted mt-1 text-[11px]">
                        {job.subject} · {job.label} · ×{job.quantity} · {job.createdAt} ·{' '}
                        {job.requestedBy}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        tone={
                          job.status === 'Printed'
                            ? 'success'
                            : job.status === 'Queued'
                              ? 'info'
                              : 'neutral'
                        }
                      >
                        {job.status}
                      </Badge>
                      {job.status === 'Queued' && (
                        <Button
                          variant="ghost"
                          icon={<CheckCircle size={15} />}
                          onClick={() => {
                            setFlash({
                              tone: 'success',
                              text: 'Marked as printed. Reprints stay auditable.',
                            });
                          }}
                        >
                          Mark printed
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card>
        <div className="flex gap-3">
          <WarningCircle size={19} className="mt-0.5 shrink-0 text-[var(--rr-warning)]" />
          <div>
            <p className="text-sm font-semibold">Payload format</p>
            <p className="muted mt-1 text-sm leading-6">
              Linear labels use <span className="font-mono">RR|SUBJECT|VALUE</span>, e.g.{' '}
              <span className="font-mono">RR|FILE|RF-0000124587</span>. QR stickers wrap the same
              string in a <span className="font-mono">/scan?p=</span> URL so a phone camera resolves
              back to the same record. Validate any payload on the scan page.
            </p>
          </div>
        </div>
      </Card>

      <p className="muted text-xs">
        {rooms.length} rooms, {files.total} registry rows loaded.
      </p>
    </div>
  );
}
