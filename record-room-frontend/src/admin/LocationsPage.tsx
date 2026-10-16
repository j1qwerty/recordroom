import { useState } from 'react';
import {
  Buildings,
  FloppyDisk,
  Plus,
  Ruler,
  Stack,
  Trash,
  WarningCircle,
} from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Field, TextInput } from '../components/ui/Field';
import { Flash, StatusBadge } from '../components/ui/Flash';
import { RoomMap } from '../components/RoomMap';
import { ShelfView } from '../components/ShelfView';
import { useQuery, useService, useSession } from '../hooks/useService';
import { cn } from '../lib/utils';
import type { Room, StorageStatus, StorageUnit } from '../types';
import type { RoomInput } from '../services/contracts';

const STATUSES: StorageStatus[] = ['Active', 'Maintenance', 'Inactive', 'Decommissioned'];

type Revision = { revision: number; note: string; at: string; actor: string };

type Dialog =
  | { kind: 'room' }
  | { kind: 'section'; roomId: string }
  | { kind: 'almirah'; sectionId: string }
  | { kind: 'shelf'; almirahId: string }
  | null;

/**
 * Location designer for the full room … section … almirah … shelf hierarchy.
 *
 * The `section` level was missing from the frontend even though the legacy
 * `Store_model.php` treated it as a first-class guard: a section cannot be
 * deactivated while it holds active almirahs, an almirah cannot be deleted
 * while files or shelf labels reference it, and a shelf cannot be deleted
 * while files sit on it. Those guards live in the service so this page only
 * reports the refusal.
 */
export function LocationsPage() {
  const service = useService();
  const { allowed } = useSession();

  const [roomId, setRoomId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [almirahId, setAlmirahId] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [flash, setFlash] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [layoutNote, setLayoutNote] = useState('');

  // The whole hierarchy comes from one read: a room carries its sections, and
  // each storage unit carries its shelves. Asking per level would refetch the
  // entire tree once for every level touched.
  const {
    data: rooms,
    loading,
    reload,
  } = useQuery(() => service.locations.listRooms(), [], [] as Room[]);

  const room = rooms.find((item) => item.id === roomId) ?? rooms[0];
  const section = room?.sections.find((item) => item.id === sectionId) ?? room?.sections[0];
  const units = room?.storageUnits.filter((unit) => unit.sectionId === section?.id) ?? [];
  const unit = units.find((item) => item.id === almirahId) ?? units[0];

  const selectedRoomId = room?.id ?? '';
  const { data: revisions, reload: reloadRevisions } = useQuery(
    () =>
      selectedRoomId
        ? service.locations.layoutRevisions(selectedRoomId)
        : Promise.resolve([] as Revision[]),
    [selectedRoomId],
    [] as Revision[],
  );

  // File counts per shelf label. One fan-out rather than a call inside the
  // render loop, so switching almirah does not leave a stale count behind.
  const shelfIds = (unit?.shelves ?? []).map((item) => item.id);
  const shelfKey = shelfIds.join('|');
  const { data: shelfCounts } = useQuery(
    async () => {
      if (shelfIds.length === 0) return {} as Record<string, number>;
      const counts = await Promise.all(
        shelfIds.map(async (id) => [id, (await service.files.byShelf(id)).length] as const),
      );
      return Object.fromEntries(counts);
    },
    [shelfKey],
    {} as Record<string, number>,
  );

  const report = async (pending: Promise<{ ok: boolean; error?: string }>) => {
    const result = await pending;
    setFlash(
      result.ok
        ? { tone: 'success', text: 'Layout updated.' }
        : { tone: 'danger', text: result.error ?? 'That change was refused.' },
    );
    if (result.ok) {
      setDialog(null);
      reload();
    }
  };

  const saveLayout = async () => {
    // `roomId` starts empty so the first room can fall into place; the resolved
    // room is what the revision is actually filed against.
    const outcome = await service.locations.saveLayout(selectedRoomId || roomId, layoutNote);
    setFlash(
      outcome.ok
        ? { tone: 'success', text: `Layout revision ${outcome.value.revision} saved.` }
        : { tone: 'danger', text: outcome.error },
    );
    if (outcome.ok) {
      setLayoutNote('');
      reload();
      reloadRevisions();
    }
  };

  if (loading && rooms.length === 0) {
    return <p className="muted">Loading rooms…</p>;
  }

  if (!room) {
    return (
      <div className="space-y-6">
        <PageHeader
          kicker="Physical configuration"
          title="Record room locations"
          description="Add a room first, then define its sections, almirahs and shelves."
          actions={
            allowed('locations.edit') && (
              <Button icon={<Plus size={17} />} onClick={() => setDialog({ kind: 'room' })}>
                Add room
              </Button>
            )
          }
        />
        {flash && <Flash tone={flash.tone} text={flash.text} onDismiss={() => setFlash(null)} />}
        <Card className="py-10 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-accent-soft text-accent">
            <Buildings size={24} />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No rooms configured yet</h2>
          <p className="muted mx-auto mt-2 max-w-md text-sm leading-6">
            Create the first physical room to start mapping sections, almirahs and shelves.
          </p>
          {allowed('locations.edit') && (
            <Button className="mt-5" icon={<Plus size={17} />} onClick={() => setDialog({ kind: 'room' })}>
              Add first room
            </Button>
          )}
        </Card>
        <Modal open={dialog?.kind === 'room'} onClose={() => setDialog(null)} title="Add room">
          {dialog?.kind === 'room' && (
            <RoomForm onSubmit={(input) => report(service.locations.addRoom(input))} />
          )}
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Physical configuration"
        title="Location designer"
        description="Room … section … almirah … shelf. Every parent has to be empty before it can be removed, and only active shelves accept new files."
        actions={
          allowed('locations.edit') && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" icon={<Plus size={17} />} onClick={() => setDialog({ kind: 'room' })}>
                Add room
              </Button>
              <Button icon={<FloppyDisk size={17} />} onClick={saveLayout}>
                Save layout
              </Button>
            </div>
          )
        }
      />

      {flash && <Flash tone={flash.tone} text={flash.text} onDismiss={() => setFlash(null)} />}

      <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Buildings size={18} className="text-accent" />
                <p className="text-sm font-semibold">Rooms</p>
              </div>
              <Badge tone="neutral">{rooms.length}</Badge>
            </div>
            <div className="mt-4 space-y-2">
              {rooms.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setRoomId(item.id);
                    setSectionId('');
                    setAlmirahId('');
                  }}
                  className={cn(
                    'focus-ring w-full rounded-xl border p-3 text-left transition',
                    item.id === room.id
                      ? 'border-[var(--rr-accent)] bg-accent-soft'
                      : 'border-base hover:bg-[var(--rr-surface-2)]',
                  )}
                >
                  <p className="text-sm font-semibold">{item.code}</p>
                  <p className="muted mt-1 text-xs">
                    {item.name} · {item.sections.length} sections · {item.storageUnits.length}{' '}
                    almirahs
                  </p>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stack size={18} className="text-accent" />
                <p className="text-sm font-semibold">Sections</p>
              </div>
              {allowed('locations.edit') && (
                <button
                  type="button"
                  onClick={() => setDialog({ kind: 'section', roomId: room.id })}
                  className="focus-ring rounded-lg p-1.5 text-accent hover:bg-accent-soft"
                  aria-label="Add section"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {room.sections.map((item) => {
                const almirahs = room.storageUnits.filter(
                  (unitItem) => unitItem.sectionId === item.id,
                );
                const shelves = almirahs.flatMap((unitItem) => unitItem.shelves);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'rounded-xl border p-3 transition',
                      item.id === section?.id
                        ? 'border-[var(--rr-accent)] bg-accent-soft'
                        : 'border-base',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSectionId(item.id);
                          setAlmirahId('');
                        }}
                        className="focus-ring flex-1 text-left"
                      >
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="muted mt-0.5 text-[11px]">
                          {almirahs.length} almirahs · {shelves.length} shelves
                        </p>
                      </button>
                      <StatusBadge status={item.status} />
                    </div>
                    {allowed('locations.edit') && (
                      <div className="mt-3 flex gap-2 border-t border-base pt-2">
                        <select
                          value={item.status}
                          aria-label={`Status of section ${item.name}`}
                          onChange={(event) =>
                            report(
                              service.locations.updateSection(item.id, {
                                status: event.target.value as StorageStatus,
                              }),
                            )
                          }
                          className="focus-ring h-8 flex-1 rounded-lg border border-base bg-[var(--rr-bg)] px-2 text-[11px]"
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => report(service.locations.deleteSection(item.id))}
                          className="focus-ring rounded-lg p-1.5 text-[var(--rr-danger)] hover:bg-[var(--rr-surface-2)]"
                          aria-label={`Remove section ${item.name}`}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card padding={false} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base p-5">
              <div>
                <p className="text-sm font-semibold">
                  {room.code} · {section ? `Section ${section.name}` : 'No section selected'}
                </p>
                <p className="muted mt-1 text-xs">
                  {section?.code} · {units.length} almirah(s) in this section
                </p>
              </div>
              {allowed('locations.edit') && section && (
                <Button
                  variant="ghost"
                  icon={<Plus size={16} />}
                  onClick={() => setDialog({ kind: 'almirah', sectionId: section.id })}
                >
                  Add almirah
                </Button>
              )}
            </div>

            <div className="p-5">
              {units.length === 0 ? (
                <p className="muted text-sm">
                  This section has no almirahs yet. Add one to hold shelf labels.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {units.map((item) => (
                    <UnitCard
                      key={item.id}
                      unit={item}
                      selected={item.id === unit?.id}
                      editable={allowed('locations.edit')}
                      onSelect={() => setAlmirahId(item.id)}
                      onAddShelf={() => setDialog({ kind: 'shelf', almirahId: item.id })}
                      onDelete={() => report(service.locations.deleteAlmirah(item.id))}
                      onStatus={(status) =>
                        report(service.locations.setUnitStatus(item.id, status))
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
            <Card padding={false} className="overflow-hidden">
              <div className="border-b border-base p-5">
                <p className="text-sm font-semibold">Canvas preview</p>
                <p className="muted mt-1 text-xs">Proportional positions for {room.code}</p>
              </div>
              <div className="p-5">
                <RoomMap
                  room={room}
                  selectedId={unit?.id}
                  onSelect={(item) => setAlmirahId(item.id)}
                />
              </div>
            </Card>

            <Card>
              <p className="text-sm font-semibold">Layout history</p>
              {revisions.length === 0 ? (
                <p className="muted mt-3 text-xs leading-6">
                  No revision saved yet. Saving bumps a revision number and records who changed the
                  layout and why — the change history the legacy app never kept.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {revisions.map((revision) => (
                    <li key={revision.revision} className="rounded-xl bg-[var(--rr-bg)] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold">Revision {revision.revision}</p>
                        <span className="muted text-[10px]">{revision.at}</span>
                      </div>
                      <p className="muted mt-1 text-[11px]">
                        {revision.note} · {revision.actor}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              {allowed('locations.edit') && (
                <div className="mt-4 border-t border-base pt-4">
                  <Field label="Revision note" htmlFor="layout-note">
                    <TextInput
                      id="layout-note"
                      value={layoutNote}
                      onChange={(event) => setLayoutNote(event.target.value)}
                      placeholder="Added section C for the 2026 intake"
                    />
                  </Field>
                  <Button
                    className="mt-3 w-full"
                    onClick={saveLayout}
                    icon={<FloppyDisk size={17} />}
                  >
                    Save layout revision
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {unit && (
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Shelf labels</p>
                  <p className="muted mt-1 text-xs">{unit.name}</p>
                </div>
                {allowed('locations.edit') && (
                  <Button
                    variant="ghost"
                    icon={<Plus size={16} />}
                    onClick={() => setDialog({ kind: 'shelf', almirahId: unit.id })}
                  >
                    Add shelf
                  </Button>
                )}
              </div>
              {unit.shelves.length === 0 ? (
                <p className="muted text-xs">
                  No shelf labels yet. A shelf needs a barcode before a file can reference it.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <ShelfView unit={unit} />
                  <div className="space-y-2">
                    {unit.shelves.map((shelf) => {
                      const files = shelfCounts[shelf.id] ?? 0;
                      return (
                        <div key={shelf.id} className="rounded-xl border border-base p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-semibold">{shelf.barcode}</span>
                            <StatusBadge status={shelf.status} />
                          </div>
                          <p className="muted mt-1.5 text-[11px]">
                            {files} file(s) · {shelf.occupied}/{shelf.capacity} approx.
                          </p>
                          {allowed('locations.edit') && (
                            <div className="mt-2 flex gap-2">
                              <select
                                value={shelf.status}
                                aria-label={`Status of ${shelf.code}`}
                                onChange={(event) =>
                                  report(
                                    service.locations.updateShelf(shelf.id, {
                                      status: event.target.value as StorageStatus,
                                    }),
                                  )
                                }
                                className="focus-ring h-8 flex-1 rounded-lg border border-base bg-[var(--rr-bg)] px-2 text-[11px]"
                              >
                                {STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => report(service.locations.deleteShelf(shelf.id))}
                                className="focus-ring rounded-lg p-1.5 text-[var(--rr-danger)] hover:bg-[var(--rr-surface-2)]"
                                aria-label={`Remove ${shelf.code}`}
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      <Modal open={dialog?.kind === 'room'} onClose={() => setDialog(null)} title="Add room">
        {dialog?.kind === 'room' && (
          <RoomForm onSubmit={(input) => report(service.locations.addRoom(input))} />
        )}
      </Modal>

      <Modal open={dialog?.kind === 'section'} onClose={() => setDialog(null)} title="Add section">
        {dialog?.kind === 'section' && (
          <SectionForm
            onSubmit={(name) => report(service.locations.addSection(dialog.roomId, { name }))}
          />
        )}
      </Modal>

      <Modal open={dialog?.kind === 'almirah'} onClose={() => setDialog(null)} title="Add almirah">
        {dialog?.kind === 'almirah' && (
          <AlmirahForm
            onSubmit={(input) => report(service.locations.addAlmirah(dialog.sectionId, input))}
          />
        )}
      </Modal>

      <Modal open={dialog?.kind === 'shelf'} onClose={() => setDialog(null)} title="Add shelf">
        {dialog?.kind === 'shelf' && (
          <ShelfForm
            onSubmit={(input) => report(service.locations.addShelf(dialog.almirahId, input))}
          />
        )}
      </Modal>
    </div>
  );
}

function UnitCard({
  unit,
  selected,
  editable,
  onSelect,
  onAddShelf,
  onDelete,
  onStatus,
}: {
  unit: StorageUnit;
  selected: boolean;
  editable: boolean;
  onSelect: () => void;
  onAddShelf: () => void;
  onDelete: () => void;
  onStatus: (status: StorageStatus) => void;
}) {
  const capacity = unit.shelves.reduce((sum, shelf) => sum + shelf.capacity, 0);
  const occupied = unit.shelves.reduce((sum, shelf) => sum + shelf.occupied, 0);

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition',
        selected ? 'border-[var(--rr-accent)] bg-accent-soft' : 'border-base bg-[var(--rr-bg)]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onSelect} className="focus-ring flex-1 text-left">
          <p className="font-mono text-xs font-semibold">{unit.code}</p>
          <p className="muted mt-1 text-[11px]">{unit.name}</p>
        </button>
        <StatusBadge status={unit.status} />
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1">
        {unit.shelves.map((shelf) => (
          <div
            key={shelf.id}
            title={`${shelf.code} · ${shelf.barcode} · ${shelf.status}`}
            className={cn(
              'h-6 rounded border',
              shelf.status === 'Active'
                ? 'border-base bg-[var(--rr-surface)]'
                : 'border-[var(--rr-warning)] bg-transparent',
            )}
          />
        ))}
        {unit.shelves.length === 0 && (
          <p className="muted col-span-4 text-[10px]">No shelf labels</p>
        )}
      </div>

      <p className="muted mt-3 flex items-center gap-1 text-[10px]">
        <Ruler size={11} /> x {unit.x}% · y {unit.y}% · {occupied}/{capacity} occupied
      </p>
      <p className="muted mt-1 font-mono text-[10px]">barcode {unit.barcode}</p>

      {editable && (
        <div className="mt-3 flex items-center gap-2 border-t border-base pt-3">
          <select
            value={unit.status}
            aria-label={`Status of ${unit.code}`}
            onChange={(event) => onStatus(event.target.value as StorageStatus)}
            className="focus-ring h-8 flex-1 rounded-lg border border-base bg-[var(--rr-surface)] px-2 text-[11px]"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onAddShelf}
            className="focus-ring rounded-lg p-1.5 text-accent hover:bg-accent-soft"
            aria-label={`Add shelf to ${unit.code}`}
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="focus-ring rounded-lg p-1.5 text-[var(--rr-danger)] hover:bg-[var(--rr-surface-2)]"
            aria-label={`Remove ${unit.code}`}
          >
            <Trash size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function RoomForm({ onSubmit }: { onSubmit: (input: RoomInput) => void }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [capacity, setCapacity] = useState(100);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ code, name, building, floor, capacity });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Room code" htmlFor="room-code" required hint="For example, RR-01.">
          <TextInput id="room-code" value={code} onChange={(event) => setCode(event.target.value)} required />
        </Field>
        <Field label="Room name" htmlFor="room-name" required>
          <TextInput id="room-name" value={name} onChange={(event) => setName(event.target.value)} required />
        </Field>
        <Field label="Building" htmlFor="room-building">
          <TextInput id="room-building" value={building} onChange={(event) => setBuilding(event.target.value)} />
        </Field>
        <Field label="Floor" htmlFor="room-floor">
          <TextInput id="room-floor" value={floor} onChange={(event) => setFloor(event.target.value)} />
        </Field>
        <Field label="Storage capacity" htmlFor="room-capacity" hint="Estimated shelf/file capacity.">
          <TextInput id="room-capacity" type="number" min={1} max={1000000} value={capacity} onChange={(event) => setCapacity(Number(event.target.value))} required />
        </Field>
      </div>
      <Button type="submit">Create room</Button>
    </form>
  );
}

function SectionForm({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(name);
      }}
    >
      <Field
        label="Section name"
        htmlFor="section-name"
        required
        hint="Legacy sections were named A, B, or a month-year label."
      >
        <TextInput
          id="section-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <div className="flex gap-3 rounded-xl bg-accent-soft p-4">
        <WarningCircle size={17} className="mt-0.5 shrink-0 text-accent" />
        <p className="muted text-xs leading-6">
          A section must be emptied of almirahs before it can be deleted, and deactivated before its
          children are.
        </p>
      </div>
      <Button type="submit">Add section</Button>
    </form>
  );
}

function AlmirahForm({
  onSubmit,
}: {
  onSubmit: (input: { code: string; name: string; barcode: string }) => void;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ code, name, barcode });
      }}
    >
      <Field label="Code" htmlFor="unit-code" required hint="Unique inside the room, e.g. A-019.">
        <TextInput
          id="unit-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="font-mono"
        />
      </Field>
      <Field label="Name" htmlFor="unit-name">
        <TextInput id="unit-name" value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <Field label="Barcode" htmlFor="unit-barcode" hint="Defaults to the code without dashes.">
        <TextInput
          id="unit-barcode"
          value={barcode}
          onChange={(event) => setBarcode(event.target.value)}
          className="font-mono"
        />
      </Field>
      <Button type="submit">Add almirah</Button>
    </form>
  );
}

function ShelfForm({
  onSubmit,
}: {
  onSubmit: (input: { code: string; name: string; barcode: string; capacity: number }) => void;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [capacity, setCapacity] = useState(80);
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ code, name, barcode, capacity });
      }}
    >
      <Field label="Code" htmlFor="shelf-code" required>
        <TextInput
          id="shelf-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="font-mono"
          placeholder="A-019-S-01"
        />
      </Field>
      <Field label="Name" htmlFor="shelf-name">
        <TextInput id="shelf-name" value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <Field
        label="Barcode"
        htmlFor="shelf-barcode"
        required
        hint="Unique. A file may only sit on a shelf whose barcode resolves and is active."
      >
        <TextInput
          id="shelf-barcode"
          value={barcode}
          onChange={(event) => setBarcode(event.target.value)}
          className="font-mono"
          placeholder="LKO019SH01"
        />
      </Field>
      <Field label="Capacity" htmlFor="shelf-capacity">
        <TextInput
          id="shelf-capacity"
          type="number"
          min={1}
          value={capacity}
          onChange={(event) => setCapacity(Number(event.target.value))}
        />
      </Field>
      <Button type="submit">Add shelf</Button>
    </form>
  );
}
