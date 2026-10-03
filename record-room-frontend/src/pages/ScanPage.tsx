import { useState, type ReactNode } from 'react';
import { Camera, CheckCircle, Crosshair } from '@phosphor-icons/react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button, LinkButton } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Field, TextInput } from '../components/ui/Field';
import { Flash, StatusBadge } from '../components/ui/Flash';
import { BarcodeSymbol } from '../components/BarcodeSymbol';
import { useQuery, useService } from '../hooks/useService';
import type { BarcodeSubject, ScanResult } from '../types';

const EMPTY_SCAN: ScanResult = { ok: false, payload: null, message: 'Nothing scanned yet.' };

/** What the right-hand panel renders: the parse result plus its resolution. */
type ScanOutcome = { result: ScanResult; resolution: Resolution | null };

/**
 * Barcode validation endpoint stand-in.
 *
 * `/scan?p=<payload>` is the QR sticker target. This page mirrors the future
 * `POST /api/barcodes/validate` contract: parse the payload, resolve it against
 * the registry or the location tables, and say plainly when it does not
 * resolve.
 */
export function ScanPage() {
  const service = useService();
  const [params] = useSearchParams();

  const [raw, setRaw] = useState(params.get('p') ?? '');
  const [submitted, setSubmitted] = useState(params.get('p') ?? '');

  // Validating a payload is two round trips: parse it, then resolve whatever it
  // points at. Both live in one query so the two stay consistent with each other.
  const { data: outcome, loading } = useQuery(
    async () => {
      if (!submitted) return null;
      const result = await service.barcodes.validate(submitted);
      const resolution = result.payload
        ? await resolve(service, result.payload.subject, result.payload.label)
        : null;
      return { result, resolution };
    },
    [submitted],
    null as ScanOutcome | null,
  );

  const result = outcome?.result ?? EMPTY_SCAN;
  const payload = result.payload;
  const resolution = outcome?.resolution ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Physical movement"
        title="Scan validation"
        description="Resolve a scanned Code 128 payload or a QR sticker URL against the registry and the location tables."
      />

      <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <Card>
          <div className="flex items-center gap-2">
            <Crosshair size={19} className="text-accent" />
            <p className="text-sm font-semibold">Scan or type a payload</p>
          </div>
          <form
            className="mt-5"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(raw);
            }}
          >
            <Field
              label="Payload"
              htmlFor="scan-input"
              hint="Format: RR|SUBJECT|VALUE, or a full /scan?p=… QR URL."
            >
              <TextInput
                id="scan-input"
                value={raw}
                onChange={(event) => setRaw(event.target.value)}
                autoFocus
                className="font-mono"
                placeholder="RR|FILE|RF-0000124587"
              />
            </Field>
            <Button type="submit" className="mt-4 w-full" icon={<CheckCircle size={17} />}>
              Validate
            </Button>
          </form>

          <div className="mt-5 rounded-xl bg-accent-soft p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-accent">
              <Camera size={14} /> Camera scanning
            </p>
            <p className="muted mt-2 text-xs leading-6">
              A USB or Bluetooth scanner types into the field above and presses Enter, which is
              already handled. Browser camera decoding needs a WASM barcode reader and is
              deliberately not shipped — see <span className="font-mono">docs/PHASED-SCOPE.md</span>
              .
            </p>
          </div>
        </Card>

        <Card>
          {!submitted ? (
            <div className="rounded-xl border border-dashed border-base p-10 text-center">
              <p className="text-sm font-semibold">Waiting for a scan</p>
              <p className="muted mt-2 text-xs">
                Scan a file, shelf, almirah, section, room or area label to resolve it.
              </p>
            </div>
          ) : loading && !outcome ? (
            <div className="rounded-xl border border-dashed border-base p-10 text-center">
              <p className="text-sm font-semibold">Resolving payload</p>
              <p className="muted mt-2 text-xs">Parsing the payload and looking it up.</p>
            </div>
          ) : !result.ok || !payload ? (
            <Flash tone="danger" text={result.message} />
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">{payload.subject} label accepted</p>
                  <p className="muted mt-1 text-xs">{result.message}</p>
                </div>
                <Badge tone="info">{payload.symbology}</Badge>
              </div>

              <div className="rounded-xl bg-[var(--rr-bg)] p-4">
                <p className="muted text-[10px] uppercase tracking-widest">Decoded value</p>
                <p className="mt-1 font-mono text-sm font-semibold text-accent">{payload.label}</p>
                <p className="muted mt-1 text-[11px]">{payload.meta}</p>
                <div className="mt-4 text-[var(--rr-text)]">
                  <BarcodeSymbol value={payload.value} height={48} />
                </div>
              </div>

              {resolution?.kind === 'resolved' && (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] muted">Resolved</p>
                  {resolution.detail}
                  <div className="flex flex-wrap gap-2">
                    {resolution.links.map((link) => (
                      <LinkButton key={link.to} to={link.to} variant="ghost">
                        {link.label}
                      </LinkButton>
                    ))}
                  </div>
                </div>
              )}

              {resolution?.kind === 'unknown' && (
                <Flash
                  tone="danger"
                  text={`The payload is well formed but ${payload.label} does not exist in the registry or the location tables.`}
                />
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

type Resolution =
  | { kind: 'resolved'; detail: ReactNode; links: Array<{ to: string; label: string }> }
  | { kind: 'unknown' };

async function resolve(
  service: ReturnType<typeof useService>,
  subject: BarcodeSubject,
  value: string,
): Promise<Resolution> {
  if (subject === 'File') {
    const file = await service.files.byBarcode(value);
    if (!file) return { kind: 'unknown' };
    return {
      kind: 'resolved',
      links: [{ to: `/files/${file.id}`, label: 'Open file' }],
      detail: (
        <div className="rounded-xl border border-base p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{file.subject}</p>
              <p className="muted mt-1 text-xs">
                {file.fileNumber} · {file.department} · {file.year}
              </p>
            </div>
            <StatusBadge status={file.status} />
          </div>
          <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
            <div>
              <dt className="muted">Current location</dt>
              <dd className="mt-0.5 font-semibold">{file.location}</dd>
            </div>
            <div>
              <dt className="muted">Holder</dt>
              <dd className="mt-0.5 font-semibold">{file.holder ?? 'On shelf'}</dd>
            </div>
            <div>
              <dt className="muted">Position on shelf</dt>
              <dd className="mt-0.5 font-mono font-semibold">{file.position}</dd>
            </div>
            <div>
              <dt className="muted">Last movement</dt>
              <dd className="mt-0.5 font-semibold">{file.lastMovement}</dd>
            </div>
          </dl>
        </div>
      ),
    };
  }

  if (subject === 'Shelf') {
    // The files call needs the shelf id, so these two are necessarily sequential.
    const shelf = await service.locations.findShelfByBarcode(value);
    if (!shelf) return { kind: 'unknown' };
    const files = await service.files.byShelf(shelf.id);
    return {
      kind: 'resolved',
      links: [{ to: '/files', label: 'Registry' }],
      detail: (
        <div className="rounded-xl border border-base p-4">
          <p className="text-sm font-semibold">{shelf.code}</p>
          <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
            <div>
              <dt className="muted">Status</dt>
              <dd className="mt-0.5">
                <StatusBadge status={shelf.status} />
              </dd>
            </div>
            <div>
              <dt className="muted">Occupancy</dt>
              <dd className="mt-0.5 font-semibold">
                {shelf.occupied}/{shelf.capacity} approx.
              </dd>
            </div>
            <div>
              <dt className="muted">Files on this shelf</dt>
              <dd className="mt-0.5 font-semibold">{files.length}</dd>
            </div>
            <div>
              <dt className="muted">Position range</dt>
              <dd className="mt-0.5 font-mono font-semibold">
                {files.length
                  ? `${Math.min(...files.map((f) => f.position))}–${Math.max(...files.map((f) => f.position))}`
                  : '—'}
              </dd>
            </div>
          </dl>
        </div>
      ),
    };
  }

  if (subject === 'Almirah') {
    for (const room of await service.locations.listRooms()) {
      const unit = room.storageUnits.find(
        (item) =>
          item.barcode.toUpperCase() === value.toUpperCase() ||
          item.code.toUpperCase() === value.toUpperCase(),
      );
      if (!unit) continue;
      const section = room.sections.find((item) => item.id === unit.sectionId);
      const occupied = unit.shelves.reduce((sum, shelf) => sum + shelf.occupied, 0);
      const capacity = unit.shelves.reduce((sum, shelf) => sum + shelf.capacity, 0);
      return {
        kind: 'resolved',
        links: [{ to: `/rooms/${room.id}`, label: 'Open room' }],
        detail: (
          <div className="rounded-xl border border-base p-4">
            <p className="text-sm font-semibold">
              {room.code} / {section?.name} / {unit.code}
            </p>
            <p className="muted mt-1 text-xs">
              {unit.shelves.length} shelves · {occupied}/{capacity} occupied · {unit.status}
            </p>
          </div>
        ),
      };
    }
    return { kind: 'unknown' };
  }

  if (subject === 'Section') {
    for (const room of await service.locations.listRooms()) {
      const section = room.sections.find(
        (item) =>
          item.code.toUpperCase() === value.toUpperCase() ||
          item.name.toUpperCase() === value.toUpperCase(),
      );
      if (!section) continue;
      const units = room.storageUnits.filter((item) => item.sectionId === section.id);
      return {
        kind: 'resolved',
        links: [{ to: `/rooms/${room.id}`, label: 'Open room' }],
        detail: (
          <div className="rounded-xl border border-base p-4">
            <p className="text-sm font-semibold">
              {room.code} · {section.name}
            </p>
            <p className="muted mt-1 text-xs">
              {units.length} almirahs · {units.flatMap((item) => item.shelves).length} shelves ·{' '}
              {section.status}
            </p>
          </div>
        ),
      };
    }
    return { kind: 'unknown' };
  }

  if (subject === 'Room') {
    const room = (await service.locations.listRooms()).find(
      (item) => item.code.toUpperCase() === value.toUpperCase(),
    );
    if (!room) return { kind: 'unknown' };
    return {
      kind: 'resolved',
      links: [{ to: `/rooms/${room.id}`, label: 'Open room' }],
      detail: (
        <div className="rounded-xl border border-base p-4">
          <p className="text-sm font-semibold">
            {room.code} · {room.name}
          </p>
          <p className="muted mt-1 text-xs">
            {room.sections.length} sections · {room.storageUnits.length} almirahs ·{' '}
            {Math.round((room.occupancy / room.capacity) * 100)}% occupied
          </p>
        </div>
      ),
    };
  }

  const area = (await service.locations.areas()).find(
    (item) => item.name.toUpperCase() === value.toUpperCase() || item.pincode === value,
  );
  if (!area) return { kind: 'unknown' };
  return {
    kind: 'resolved',
    links: [{ to: '/files', label: 'Files in this area' }],
    detail: (
      <div className="rounded-xl border border-base p-4">
        <p className="text-sm font-semibold">{area.name}</p>
        <p className="muted mt-1 text-xs">
          Pincode {area.pincode} · {area.status}
        </p>
      </div>
    ),
  };
}

export type { Resolution };
