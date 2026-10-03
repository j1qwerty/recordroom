import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Barcode, CheckCircle, MapPin, WarningCircle } from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, FormGrid, SelectInput, TextArea, TextInput } from '../components/ui/Field';
import { Flash } from '../components/ui/Flash';
import { BarcodeSymbol } from '../components/BarcodeSymbol';
import { useQuery, useService } from '../hooks/useService';
import { buildPayload } from '../lib/barcode';
import { nextFileBarcode } from '../services/impl/files';
import type { Area, FileCreateInput, FileType, RecordFile, StorageStatus } from '../types';
import type { Page, RecordRoomService } from '../services/contracts';

const FILE_TYPES: FileType[] = ['Letter', 'File', 'Register', 'Map', 'Drawing', 'Report'];
const COAL_LIVES = [
  '10 years',
  '15 years',
  '25 years',
  '30 years',
  'Permanent',
  'As per department rules',
];

const EMPTY_FILES: Page<RecordFile> = { items: [], total: 0, page: 1, pageSize: 200 };

const emptyForm: FileCreateInput = {
  fileBarcode: '',
  subject: '',
  department: '',
  year: new Date().getFullYear(),
  fileType: 'File',
  shelfId: '',
  position: 1,
  pincode: '',
  area: '',
  propertyNo: '',
  propertyArea: '',
  dealer: '',
  codalLife: '25 years',
  description: '',
};

/** One row of the location tree, flattened for the shelf dropdowns. */
interface ShelfPath {
  id: string;
  status: StorageStatus;
  barcode: string;
  code: string;
  capacity: number;
  occupied: number;
  free: number;
  /** `room / section / almirah / shelf`, as shown to the operator. */
  label: string;
  /** Same path without the section, as the blocked-shelf notice used to read. */
  blockedLabel: string;
  path: string;
}

/**
 * Walks room → section → almirah → shelf in parallel and flattens the result.
 *
 * The API owns the hierarchy, so the dropdown cannot be built from a local
 * snapshot: every level is a request, and they are issued together because the
 * next level needs the ids from the one before it.
 */
async function loadShelfPaths(service: RecordRoomService): Promise<ShelfPath[]> {
  const rooms = await service.locations.listRooms();
  const perRoom = await Promise.all(rooms.map((room) => service.locations.sectionsOf(room.id)));
  const perSection = await Promise.all(
    perRoom.flatMap((list) => list.map((section) => service.locations.unitsOf(section.id))),
  );
  const perUnit = await Promise.all(
    perSection.flatMap((list) => list.map((unit) => service.locations.shelvesOf(unit.id))),
  );

  const paths: ShelfPath[] = [];
  let sectionAt = 0;
  let unitAt = 0;
  let shelfAt = 0;

  for (const room of rooms) {
    for (const section of perRoom[sectionAt++]) {
      for (const unit of perSection[unitAt++]) {
        for (const shelf of perUnit[shelfAt++]) {
          paths.push({
            id: shelf.id,
            status: shelf.status,
            barcode: shelf.barcode,
            code: shelf.code,
            capacity: shelf.capacity,
            occupied: shelf.occupied,
            free: shelf.capacity - shelf.occupied,
            label: `${room.code} / ${section.name} / ${unit.code} / ${shelf.code}`,
            blockedLabel: `${room.code} / ${unit.code} / ${shelf.code}`,
            path: [room.code, section.code, unit.code, shelf.code].filter(Boolean).join(' / '),
          });
        }
      }
    }
  }

  return paths;
}

/**
 * File registration with the legacy guards applied.
 *
 * `checkfilebarcode` (unique barcode), `checkShelfBarcode` (shelf exists and is
 * active) and `getpincode` (area → pincode) all run through
 * `filesService.validateCreate` before the write is allowed.
 */
export function NewFilePage() {
  const service = useService();
  const navigate = useNavigate();

  // `nextFileBarcode` needs the live series, which only the API can report, so
  // the highest barcodes are asked for rather than read off the local snapshot.
  const { data: recent, reload: reloadFiles } = useQuery(
    () => service.files.list({ sort: 'fileBarcode', direction: 'desc', pageSize: 200 }),
    [],
    EMPTY_FILES,
  );

  const [draft, setDraft] = useState<FileCreateInput>(emptyForm);
  /** Set once the operator types a barcode of their own; null means "follow the registry". */
  const [barcodeOverride, setBarcodeOverride] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FileCreateInput>(key: K, value: FileCreateInput[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  // The next free barcode follows the registry until the operator overrides it,
  // so the suggestion advances on its own once the first load (or the reload
  // after a create) answers.
  const suggestedBarcode = useMemo(() => nextFileBarcode(recent.items), [recent]);
  const form: FileCreateInput = { ...draft, fileBarcode: barcodeOverride ?? suggestedBarcode };

  // The whole location tree in one read, from which both shelf lists are derived.
  const { data: shelfPaths } = useQuery(() => loadShelfPaths(service), [], [] as ShelfPath[]);
  const { data: areas } = useQuery(() => service.locations.areas(), [], [] as Area[]);

  const shelfOptions = useMemo(
    () => shelfPaths.filter((path) => path.status === 'Active'),
    [shelfPaths],
  );
  const blockedShelves = useMemo(
    () => shelfPaths.filter((path) => path.status !== 'Active'),
    [shelfPaths],
  );

  // Live validation mirrors the service, so the operator sees the same verdict
  // before pressing the button. It costs a round trip, so it stays off until
  // there is something worth checking.
  const { data: issues } = useQuery(
    () =>
      form.fileBarcode.trim() || form.shelfId
        ? service.files.validateCreate(form)
        : Promise.resolve([]),
    [
      form.fileBarcode,
      form.subject,
      form.department,
      form.year,
      form.shelfId,
      form.position,
      form.area,
      form.pincode,
    ],
    [],
  );
  const errorsFor = (field: string) =>
    issues.find((i) => i.field === field && i.severity === 'error')?.message;
  const warningFor = (field: string) =>
    issues.find((i) => i.field === field && i.severity === 'warning')?.message;

  const payload = buildPayload('File', form.fileBarcode || 'RF-0000000000');

  // getpincode: resolve the pincode as soon as a known area is picked.
  const onAreaChange = (name: string) => {
    const area = areas.find((item) => item.name === name);
    setDraft((current) => ({
      ...current,
      area: name,
      pincode: area ? area.pincode : current.pincode,
    }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await service.files.create(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setCreatedId(result.value.id);
      // The new barcode has to be in the series before the next suggestion.
      reloadFiles();
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setDraft(emptyForm);
    setBarcodeOverride(null);
    setCreatedId(null);
    reloadFiles();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Registry"
        title="Create physical file"
        description="Identity and placement are validated the way the legacy registry validated them: unique barcode, active shelf, known area."
      />

      {createdId ? (
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              <CheckCircle size={22} weight="fill" className="mt-0.5 text-[var(--rr-success)]" />
              <div>
                <p className="text-sm font-semibold">{form.fileBarcode} registered</p>
                <p className="muted mt-1 text-sm leading-6">
                  Shelf occupancy and the movement log were updated in the same write, and the
                  creation is on the audit trail.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => navigate(`/files/${createdId}`)}>
                Open file
              </Button>
              <Button onClick={resetForm}>Register another</Button>
            </div>
          </div>
        </Card>
      ) : (
        <form onSubmit={submit}>
          <div className="grid gap-5 xl:grid-cols-[1fr_.7fr]">
            <div className="space-y-5">
              <Card>
                <p className="text-sm font-semibold">Identity</p>
                <div className="mt-4">
                  <FormGrid>
                    <Field
                      label="File barcode"
                      htmlFor="file-barcode"
                      required
                      error={errorsFor('fileBarcode')}
                      hint={warningFor('fileBarcode')}
                    >
                      <TextInput
                        id="file-barcode"
                        value={form.fileBarcode}
                        onChange={(event) => {
                          setBarcodeOverride(event.target.value);
                        }}
                        className="font-mono"
                        invalid={Boolean(errorsFor('fileBarcode'))}
                      />
                    </Field>
                    <Field
                      label="Department"
                      htmlFor="file-department"
                      required
                      error={errorsFor('department')}
                    >
                      <TextInput
                        id="file-department"
                        value={form.department}
                        onChange={(event) => set('department', event.target.value)}
                        placeholder="Revenue"
                      />
                    </Field>
                    <Field
                      label="Subject"
                      htmlFor="file-subject"
                      required
                      error={errorsFor('subject')}
                    >
                      <TextInput
                        id="file-subject"
                        value={form.subject}
                        onChange={(event) => set('subject', event.target.value)}
                        placeholder="Land acquisition review for NH-2"
                      />
                    </Field>
                    <Field label="Year" htmlFor="file-year" required error={errorsFor('year')}>
                      <TextInput
                        id="file-year"
                        type="number"
                        value={form.year}
                        onChange={(event) => set('year', Number(event.target.value))}
                      />
                    </Field>
                    <Field label="Type" htmlFor="file-type">
                      <SelectInput
                        id="file-type"
                        value={form.fileType}
                        onChange={(event) => set('fileType', event.target.value as FileType)}
                      >
                        {FILE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                    <Field label="Codal life" htmlFor="file-codal">
                      <SelectInput
                        id="file-codal"
                        value={form.codalLife}
                        onChange={(event) => set('codalLife', event.target.value)}
                      >
                        {COAL_LIVES.map((life) => (
                          <option key={life} value={life}>
                            {life}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                  </FormGrid>
                </div>
              </Card>

              <Card>
                <p className="text-sm font-semibold">Placement</p>
                <div className="mt-4">
                  <FormGrid>
                    <Field
                      label="Shelf"
                      htmlFor="file-shelf"
                      required
                      error={errorsFor('shelfId')}
                      hint={
                        warningFor('shelfId') ?? `${shelfOptions.length} active shelves available`
                      }
                      className="sm:col-span-2"
                    >
                      <SelectInput
                        id="file-shelf"
                        value={form.shelfId}
                        onChange={(event) => set('shelfId', event.target.value)}
                        invalid={Boolean(errorsFor('shelfId'))}
                      >
                        <option value="">Select a shelf</option>
                        {shelfOptions.map((shelf) => (
                          <option key={shelf.id} value={shelf.id}>
                            {shelf.label} · {shelf.free} free · {shelf.barcode}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                    <Field
                      label="Position on shelf (1–100)"
                      htmlFor="file-position"
                      error={errorsFor('position')}
                    >
                      <TextInput
                        id="file-position"
                        type="number"
                        min={1}
                        max={100}
                        value={form.position}
                        onChange={(event) => set('position', Number(event.target.value))}
                      />
                    </Field>
                    <Field
                      label="Area"
                      htmlFor="file-area"
                      error={errorsFor('area')}
                      hint={warningFor('area')}
                    >
                      <SelectInput
                        id="file-area"
                        value={form.area}
                        onChange={(event) => onAreaChange(event.target.value)}
                      >
                        <option value="">Not recorded</option>
                        {areas.map((area) => (
                          <option key={area.id} value={area.name}>
                            {area.name} · {area.pincode}
                            {area.status !== 'Active' ? ' (inactive)' : ''}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                    <Field
                      label="Pincode"
                      htmlFor="file-pincode"
                      hint="Resolved from the area, like getpincode"
                    >
                      <TextInput
                        id="file-pincode"
                        value={form.pincode}
                        onChange={(event) => set('pincode', event.target.value)}
                        className="font-mono"
                      />
                    </Field>
                    <Field label="Property number" htmlFor="file-property">
                      <TextInput
                        id="file-property"
                        value={form.propertyNo}
                        onChange={(event) => set('propertyNo', event.target.value)}
                        placeholder="PROP-0000"
                      />
                    </Field>
                    <Field label="Property area" htmlFor="file-property-area">
                      <TextInput
                        id="file-property-area"
                        value={form.propertyArea}
                        onChange={(event) => set('propertyArea', event.target.value)}
                        placeholder="2.4 hectare"
                      />
                    </Field>
                    <Field label="Dealer" htmlFor="file-dealer">
                      <TextInput
                        id="file-dealer"
                        value={form.dealer}
                        onChange={(event) => set('dealer', event.target.value)}
                      />
                    </Field>
                    <Field label="Description" htmlFor="file-description" className="sm:col-span-2">
                      <TextArea
                        id="file-description"
                        value={form.description}
                        onChange={(event) => set('description', event.target.value)}
                        placeholder="Short identification note for retrieval staff"
                      />
                    </Field>
                  </FormGrid>
                </div>
              </Card>

              {blockedShelves.length > 0 && (
                <div className="flex gap-3 rounded-2xl border border-base bg-accent-soft p-5">
                  <WarningCircle size={20} className="mt-0.5 shrink-0 text-accent" />
                  <div>
                    <p className="text-sm font-semibold">
                      {blockedShelves.length} shelves are not accepting new files
                    </p>
                    <p className="muted mt-1 text-xs leading-6">
                      {blockedShelves
                        .slice(0, 4)
                        .map((shelf) => `${shelf.blockedLabel} (${shelf.status})`)
                        .join(', ')}
                      {blockedShelves.length > 4 && ` and ${blockedShelves.length - 4} more`}.
                      Reopen them in the location designer before filing against them.
                    </p>
                  </div>
                </div>
              )}

              {error && <Flash tone="danger" text={error} onDismiss={() => setError(null)} />}

              <div className="flex gap-2">
                <Button type="submit" icon={<CheckCircle size={17} />} disabled={saving}>
                  {saving ? 'Creating…' : 'Create file'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => navigate('/files')}>
                  Cancel
                </Button>
              </div>
            </div>

            <div className="space-y-5">
              <Card>
                <div className="flex items-center gap-2">
                  <Barcode className="text-accent" size={19} />
                  <p className="text-sm font-semibold">Identity preview</p>
                </div>
                <div className="mt-5 rounded-xl bg-[var(--rr-bg)] p-4">
                  <p className="muted text-[10px] uppercase tracking-widest">File barcode</p>
                  <p className="mt-2 font-mono text-lg font-semibold text-accent">
                    {form.fileBarcode || '—'}
                  </p>
                  <div className="mt-4 text-[var(--rr-text)]">
                    <BarcodeSymbol value={payload.value} height={56} />
                  </div>
                  <p className="muted mt-4 text-xs leading-6">
                    Permanent identity: the RF barcode never changes. Location is stored separately
                    and can be corrected without issuing a new identity.
                  </p>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2">
                  <MapPin className="text-accent" size={19} />
                  <p className="text-sm font-semibold">Placement preview</p>
                </div>
                <div className="mt-4 rounded-xl bg-[var(--rr-bg)] p-4">
                  {form.shelfId ? (
                    <PlacementPreview
                      shelfId={form.shelfId}
                      path={shelfPaths.find((item) => item.id === form.shelfId) ?? null}
                    />
                  ) : (
                    <p className="muted text-xs">Pick a shelf to see the retrieval path.</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

function PlacementPreview({ shelfId, path }: { shelfId: string; path: ShelfPath | null }) {
  const service = useService();
  // The path itself came from the page's location read; only the occupancy count
  // still needs asking for.
  const { data: onShelf } = useQuery(
    () => service.files.byShelf(shelfId),
    [shelfId],
    [] as RecordFile[],
  );
  if (!path) return <p className="muted text-xs">Shelf not found.</p>;

  return (
    <div className="space-y-3">
      <p className="font-mono text-sm font-semibold">{path.path}</p>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="muted">Shelf barcode</dt>
          <dd className="mt-0.5 font-mono font-semibold">{path.barcode}</dd>
        </div>
        <div>
          <dt className="muted">Occupancy</dt>
          <dd className="mt-0.5 font-semibold">
            {path.occupied}/{path.capacity}
          </dd>
        </div>
        <div>
          <dt className="muted">Files on shelf</dt>
          <dd className="mt-0.5 font-semibold">{onShelf.length}</dd>
        </div>
        <div>
          <dt className="muted">Status</dt>
          <dd className="mt-0.5 font-semibold">{path.status}</dd>
        </div>
      </dl>
    </div>
  );
}
