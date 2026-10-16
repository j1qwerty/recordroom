import { useState } from 'react';
import {
  ArrowLeft,
  Barcode,
  CheckCircle,
  ClockCounterClockwise,
  FileText,
  MapPin,
  Printer,
  ShieldCheck,
  UserCircle,
} from '@phosphor-icons/react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button, LinkButton } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Field, SelectInput, TextInput } from '../components/ui/Field';
import { Flash, StatusBadge } from '../components/ui/Flash';
import { BarcodeSymbol } from '../components/BarcodeSymbol';
import { ShelfView } from '../components/ShelfView';
import { useQuery, useService, useSession } from '../hooks/useService';
import { buildPayload } from '../lib/barcode';
import type { Page } from '../services/contracts';
import type {
  DigitizationBatch,
  DigitizationPage,
  IssueRecord,
  MapUpload,
  MovementEvent,
  RecordFile,
  Room,
} from '../types';

const EMPTY_ROOMS: Room[] = [];
const EMPTY_MOVEMENTS: MovementEvent[] = [];
const EMPTY_BATCHES: DigitizationBatch[] = [];
const EMPTY_MAPS: MapUpload[] = [];
const EMPTY_ISSUE_PAGE: Page<IssueRecord> = { items: [], total: 0, page: 1, pageSize: 500 };

/** A scanned page plus the batch code it belongs to, for the stitching preview. */
type FilePage = DigitizationPage & { batchCode: string };

export function FileDetailPage() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const service = useService();
  const { allowed } = useSession();

  const [shelfId, setShelfId] = useState('');
  const [position, setPosition] = useState(1);
  const [reason, setReason] = useState('');
  const [eOfficeDraft, setEOfficeDraft] = useState<string | null>(null);
  const [savingEOffice, setSavingEOffice] = useState(false);
  const [flash, setFlash] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  // One file id drives every read on this page. `rooms` comes back whole because
  // the location breadcrumb, the shelf picker and the shelf diagram all derive
  // from it, and the API has no cheaper single-room-plus-relations endpoint.
  const {
    data: file,
    loading,
    reload: reloadFile,
  } = useQuery(() => service.files.get(fileId ?? ''), [fileId], null as RecordFile | null);
  const { data: rooms } = useQuery(() => service.locations.listRooms(), [], EMPTY_ROOMS);
  const { data: movements, reload: reloadMovements } = useQuery(
    () => service.movements.list({ fileId: fileId ?? '', limit: 50 }),
    [fileId],
    EMPTY_MOVEMENTS,
  );
  const { data: batches } = useQuery(() => service.digitization.batches(), [], EMPTY_BATCHES);
  const { data: maps } = useQuery(
    () => service.uploads.maps({ fileBarcode: file?.fileBarcode ?? '' }),
    [file?.fileBarcode],
    EMPTY_MAPS,
  );
  const { data: openIssues } = useQuery(
    () => service.issues.list({ open: true, pageSize: 500 }),
    [],
    EMPTY_ISSUE_PAGE,
  );

  // The record arrives from the API, so a missing row and an unanswered read
  // are different states: only the latter is still loading.
  if (!file) {
    return (
      <div className="space-y-6">
        <Link to="/files" className="inline-flex items-center gap-2 text-xs font-semibold muted">
          <ArrowLeft size={15} /> All files
        </Link>
        <EmptyState
          title={loading ? 'Loading file' : 'File not found'}
          description={
            loading
              ? 'Asking the registry for this file.'
              : 'That id is not in the local registry dataset.'
          }
          action={
            loading ? undefined : (
              <Link to="/files" className="focus-ring text-xs font-semibold text-accent">
                Back to the registry
              </Link>
            )
          }
        />
      </div>
    );
  }

  const room = rooms.find((item) => item.id === file.roomId);
  const unit =
    room?.storageUnits.find((item) => item.id === file.almirahId) ?? room?.storageUnits[0];
  const section = room?.sections.find((item) => item.id === file.sectionId);
  const pages: FilePage[] = batches
    .flatMap((batch) => batch.pages.map((page) => ({ ...page, batchCode: batch.code })))
    .filter((page) => page.fileBarcode === file.fileBarcode);
  const openIssue = openIssues.items.find((issue) =>
    issue.lines.some((line) => line.fileId === file.id),
  );

  const shelfOptions = rooms.flatMap((item) =>
    item.sections.flatMap((sec) =>
      item.storageUnits
        .filter((u) => u.sectionId === sec.id)
        .flatMap((u) =>
          u.shelves
            .filter((shelf) => shelf.status === 'Active')
            .map((shelf) => ({
              id: shelf.id,
              label: `${item.code} / ${sec.name} / ${u.code} / ${shelf.code}`,
            })),
        ),
    ),
  );

  const saveEOfficeReference = async () => {
    if (!file) return;
    setSavingEOffice(true);
    try {
      const result = await service.files.updateEOfficeReference(
        file.id,
        eOfficeDraft ?? file.eOfficeReference ?? '',
      );
      if (!result.ok) {
        setFlash({ tone: 'danger', text: result.error });
        return;
      }
      setEOfficeDraft(result.value.eOfficeReference ?? '');
      setFlash({
        tone: 'success',
        text: result.value.eOfficeReference
          ? 'E-office reference saved.'
          : 'E-office reference cleared.',
      });
      reloadFile();
    } finally {
      setSavingEOffice(false);
    }
  };

  const relocate = async () => {
    const result = await service.files.relocate(file.id, shelfId, position, reason);
    if (!result.ok) {
      setFlash({ tone: 'danger', text: result.error });
      return;
    }
    setFlash({
      tone: 'success',
      text: `Relocated to ${result.value.location}. Identity ${result.value.fileBarcode} is unchanged.`,
    });
    setShelfId('');
    setReason('');
    // Relocation changes the file row and appends a movement event, so both
    // reads have to be refetched or the page keeps showing the old shelf.
    reloadFile();
    reloadMovements();
  };

  return (
    <div className="space-y-7">
      <button
        onClick={() => navigate(-1)}
        className="focus-ring inline-flex items-center gap-2 text-xs font-semibold muted hover:text-[var(--rr-text)]"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <PageHeader
        kicker="Record file"
        title={file.subject}
        description={`${file.fileNumber} · ${file.department} · ${file.year}`}
        actions={
          <>
            <Button variant="ghost" icon={<Printer size={17} />} onClick={() => window.print()}>
              Print label
            </Button>
            <LinkButton to="/issue" icon={<Barcode size={17} />}>
              Issue / move
            </LinkButton>
          </>
        }
      />

      {flash && <Flash tone={flash.tone} text={flash.text} onDismiss={() => setFlash(null)} />}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-5">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-sm font-semibold text-accent">{file.fileBarcode}</p>
                <p className="muted mt-2 text-xs">
                  Permanent identity · immutable for the file lifecycle
                </p>
              </div>
              <StatusBadge status={file.status} />
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Info label="File number" value={file.fileNumber} />
              <Info label="Department" value={file.department} />
              <Info label="Type" value={file.fileType} />
              <Info label="Year" value={String(file.year)} />
              <Info label="Codal life" value={file.codalLife} />
              <Info label="Created" value={`${file.createdAt} by ${file.createdBy}`} />
              <Info label="Area / pincode" value={`${file.area || '—'} / ${file.pincode || '—'}`} />
              <Info
                label="Property"
                value={`${file.propertyNo || '—'} · ${file.propertyArea || '—'}`}
              />
              <Info label="Dealer" value={file.dealer || '—'} />
              <Info label="Last movement" value={file.lastMovement} />
            </div>
            <div className="mt-6 rounded-xl bg-[var(--rr-bg)] p-4 text-[var(--rr-text)]">
              <BarcodeSymbol value={buildPayload('File', file.fileBarcode).value} height={56} />
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">E-office reference</p>
                <p className="muted mt-1 text-xs">
                  {file.eOfficeReference?.trim()
                    ? 'This registry record is linked to an e-office file.'
                    : 'No e-office file name or ID has been recorded.'}
                </p>
              </div>
              <Badge tone={file.eOfficeReference?.trim() ? 'success' : 'neutral'}>
                {file.eOfficeReference?.trim() ? 'Linked' : 'Not linked'}
              </Badge>
            </div>
            {file.eOfficeReference?.trim() && (
              <p className="mt-3 break-all rounded-lg bg-[var(--rr-bg)] p-3 font-mono text-xs">
                {file.eOfficeReference}
              </p>
            )}
            {allowed('files.edit') && (
              <div className="mt-4 space-y-3 border-t border-base pt-4">
                <Field label="E-office file name / ID" htmlFor="eoffice-reference" hint="Optional. Clear the field to remove the link.">
                  <TextInput
                    id="eoffice-reference"
                    value={eOfficeDraft ?? file.eOfficeReference ?? ''}
                    onChange={(event) => setEOfficeDraft(event.target.value)}
                    placeholder="e.g. EOFFICE/REV/2026/00123"
                  />
                </Field>
                <div className="flex justify-end">
                  <Button onClick={() => void saveEOfficeReference()} disabled={savingEOffice}>
                    {savingEOffice ? 'Saving…' : 'Save e-office reference'}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <FileText className="text-accent" size={19} />
              <p className="text-sm font-semibold">Description</p>
            </div>
            <p className="muted mt-4 text-sm leading-7">{file.description}</p>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-accent" size={19} />
              <p className="text-sm font-semibold">Digital document</p>
            </div>
            {pages.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-base p-5">
                <p className="text-sm font-semibold">No scanned page attached yet.</p>
                <p className="muted mt-1 text-xs leading-6">
                  {maps.length} map/copy upload(s) on record. The backend will stitch page versions
                  into a PDF, attach OCR text and checksums, and enforce access policy — the legacy
                  <span className="font-mono"> generate_pdf</span> equivalent.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-base p-3"
                  >
                    <div>
                      <p className="font-mono text-xs font-semibold">{page.filename}</p>
                      <p className="muted mt-0.5 text-[11px]">
                        {page.batchCode} · page {page.pageNo} · version {page.version}
                      </p>
                    </div>
                    <StatusBadge status={page.status} />
                  </div>
                ))}
                <div className="rounded-xl bg-accent-soft p-3">
                  <p className="text-xs font-semibold">
                    {pages.length} page version(s) ready for stitching
                  </p>
                  <p className="muted mt-1 text-[11px] leading-5">
                    Only approved versions are eligible. PDF assembly happens server-side where the
                    object store lives.
                  </p>
                </div>
              </div>
            )}
          </Card>

          <Card padding={false} className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-base p-5">
              <ClockCounterClockwise className="text-accent" size={19} />
              <p className="text-sm font-semibold">Location and movement history</p>
            </div>
            {movements.length === 0 ? (
              <p className="muted p-5 text-xs">No recorded movement for this file yet.</p>
            ) : (
              <ol className="divide-y divide-[var(--rr-border)]">
                {movements.map((event) => (
                  <li key={event.id} className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <Badge tone="info">{event.kind}</Badge>
                      <span className="muted text-[11px]">
                        {event.at} · {event.actor}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                      <div>
                        <p className="muted text-[10px] uppercase tracking-wider">From</p>
                        <p className="mt-0.5 font-semibold">{event.from}</p>
                      </div>
                      <div>
                        <p className="muted text-[10px] uppercase tracking-wider">To</p>
                        <p className="mt-0.5 font-semibold">{event.to}</p>
                      </div>
                    </div>
                    <p className="muted mt-2 text-[11px]">{event.detail}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Exact physical location</p>
                <p className="muted mt-1 text-xs">Room → section → almirah → shelf</p>
              </div>
              <MapPin className="text-accent" size={19} />
            </div>
            <div className="mt-4 rounded-xl bg-accent-soft p-4">
              <p className="text-sm font-semibold">{file.location}</p>
              <p className="muted mt-2 text-xs">
                Approximate shelf position · {file.position}% along shelf
              </p>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--rr-surface)]">
                <div
                  className="h-full rounded-full bg-[var(--rr-accent)]"
                  style={{ width: `${file.position}%` }}
                />
              </div>
              <p className="muted mt-3 font-mono text-[11px]">
                shelf barcode {file.shelfBarcode || '—'}
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <LinkButton
                to={`/rooms/${file.roomId}`}
                variant="ghost"
                className="flex-1"
                icon={<MapPin size={16} />}
              >
                Open room
              </LinkButton>
              <LinkButton
                to="/scan"
                variant="ghost"
                className="flex-1"
                icon={<Barcode size={16} />}
              >
                Validate scan
              </LinkButton>
            </div>
            {section && (
              <p className="muted mt-4 border-t border-base pt-4 text-xs leading-6">
                Section <span className="font-mono font-semibold">{section.name}</span> of room{' '}
                {room?.code}. A section may only be deactivated once its almirahs are, which is what
                keeps every file resolvable to a shelf.
              </p>
            )}
          </Card>

          {unit && (
            <Card>
              <ShelfView unit={unit} activeShelf={file.shelf} />
            </Card>
          )}

          <Card>
            <div className="flex items-center gap-2">
              <UserCircle className="text-accent" size={19} />
              <p className="text-sm font-semibold">Current custodian state</p>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-[var(--rr-bg)] p-4">
              <CheckCircle
                size={20}
                className={file.holder ? 'text-[var(--rr-warning)]' : 'text-[var(--rr-success)]'}
              />
              <div>
                <p className="text-sm font-semibold">{file.holder ?? 'In record room'}</p>
                {openIssue ? (
                  <p className="muted mt-1 text-xs">
                    Receipt {openIssue.receiptNumber} · due {openIssue.dueAt} · {openIssue.purpose}
                  </p>
                ) : (
                  <p className="muted mt-1 text-xs">
                    Custody changes only through the issue and return desks.
                  </p>
                )}
              </div>
            </div>
          </Card>

          {allowed('files.edit') && (
            <Card>
              <p className="text-sm font-semibold">Relocate this file</p>
              <p className="muted mt-1 text-xs leading-6">
                Identity never changes. Only the shelf and position move, and the change is written
                to the movement log and the audit trail together.
              </p>
              <div className="mt-4 space-y-4">
                <Field label="New shelf" htmlFor="relocate-shelf" required>
                  <SelectInput
                    id="relocate-shelf"
                    value={shelfId}
                    onChange={(event) => setShelfId(event.target.value)}
                  >
                    <option value="">Select a shelf</option>
                    {shelfOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Position on shelf (1–100)" htmlFor="relocate-position">
                  <TextInput
                    id="relocate-position"
                    type="number"
                    min={1}
                    max={100}
                    value={position}
                    onChange={(event) => setPosition(Number(event.target.value))}
                  />
                </Field>
                <Field label="Reason" htmlFor="relocate-reason">
                  <TextInput
                    id="relocate-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Shelf mapping reconciled during physical audit"
                  />
                </Field>
                <Button className="w-full" onClick={relocate} disabled={!shelfId}>
                  Relocate file
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="muted text-[10px] uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
