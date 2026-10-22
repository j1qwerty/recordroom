import { useState } from 'react';
import {
  ArrowLeft,
  Buildings,
  CheckCircle,
  Cube,
  MagnifyingGlass,
  Stack,
} from '@phosphor-icons/react';
import { useNavigate, useParams } from 'react-router-dom';
import { RoomMap } from '../components/RoomMap';
import { ShelfView } from '../components/ShelfView';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/Flash';
import { EmptyState } from '../components/ui/EmptyState';
import { LinkButton } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { useDb } from '../hooks/useService';
import { cn } from '../lib/utils';

export function RoomDetailPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const db = useDb();

  const room = db.rooms.find((item) => item.id === roomId) ?? db.rooms[0];
  const [sectionId, setSectionId] = useState('');
  const [unitId, setUnitId] = useState('');

  const section = room.sections.find((item) => item.id === sectionId) ?? room.sections[0];
  const units = room.storageUnits.filter((item) => !section || item.sectionId === section.id);
  const selected = units.find((item) => item.id === unitId) ?? units[0];

  if (!room) {
    return (
      <EmptyState
        title="Room not found"
        description="That room id is not in the local dataset."
        action={
          <LinkButton to="/rooms" variant="ghost">
            All rooms
          </LinkButton>
        }
      />
    );
  }

  const filesInRoom = db.files.filter((file) => file.roomId === room.id);

  return (
    <div className="space-y-7">
      <button
        onClick={() => navigate('/rooms')}
        className="focus-ring inline-flex items-center gap-2 text-xs font-semibold muted hover:text-[var(--rr-text)]"
      >
        <ArrowLeft size={15} /> All rooms
      </button>

      <PageHeader
        kicker={`${room.code} · ${room.building} · ${room.floor}`}
        title={room.name}
        description="Room → section → almirah → shelf. Select a section, then an almirah, to see shelf-level occupancy."
        actions={
          <LinkButton to="/search" icon={<MagnifyingGlass size={17} />}>
            Locate file
          </LinkButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Sections" value={String(room.sections.length)} />
        <Metric label="Almirahs" value={String(room.storageUnits.length)} />
        <Metric
          label="Shelves"
          value={String(room.storageUnits.flatMap((item) => item.shelves).length)}
        />
        <Metric label="Files loaded" value={String(filesInRoom.length)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-5">
          <Card padding={false} className="overflow-hidden">
            <div className="border-b border-base p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cube size={18} className="text-accent" />
                  <p className="text-sm font-semibold">Interactive room map</p>
                </div>
                <Badge tone="success">Live map</Badge>
              </div>
            </div>
            <RoomMap
              room={room}
              selectedId={selected?.id}
              onSelect={(unit) => setUnitId(unit.id)}
            />
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <Stack className="text-accent" size={18} />
              <p className="text-sm font-semibold">Sections in this room</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {room.sections.map((item) => {
                const itemUnits = room.storageUnits.filter((unit) => unit.sectionId === item.id);
                const capacity = itemUnits
                  .flatMap((unit) => unit.shelves)
                  .reduce((sum, shelf) => sum + shelf.capacity, 0);
                const occupied = itemUnits
                  .flatMap((unit) => unit.shelves)
                  .reduce((sum, shelf) => sum + shelf.occupied, 0);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSectionId(item.id);
                      setUnitId('');
                    }}
                    className={cn(
                      'focus-ring rounded-xl border p-4 text-left transition',
                      section?.id === item.id
                        ? 'border-[var(--rr-accent)] bg-accent-soft'
                        : 'border-base hover:bg-[var(--rr-surface-2)]',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-sm font-semibold">{item.name}</p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="muted mt-1.5 text-[11px]">
                      {itemUnits.length} almirahs ·{' '}
                      {itemUnits.flatMap((unit) => unit.shelves).length} shelves
                    </p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--rr-surface-2)]">
                      <div
                        className="h-full rounded-full bg-[var(--rr-accent)]"
                        style={{ width: `${capacity === 0 ? 0 : (occupied / capacity) * 100}%` }}
                      />
                    </div>
                    <p className="muted mt-1 text-[10px]">
                      {occupied}/{capacity} approx. occupied
                    </p>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Selected almirah</p>
                <p className="muted mt-1 text-xs">
                  {section ? `Section ${section.name}` : 'No section'} · click an almirah in the map
                </p>
              </div>
              <CheckCircle className="text-accent" size={19} />
            </div>
            {selected ? (
              <>
                <div className="mt-5 rounded-xl bg-[var(--rr-bg)] p-4">
                  <p className="text-lg font-semibold">{selected.name}</p>
                  <p className="muted mt-1 text-xs">
                    {selected.code} · {selected.type} · barcode {selected.barcode}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="muted text-[10px] uppercase tracking-wider">Status</p>
                      <p className="mt-1 text-sm font-semibold">{selected.status}</p>
                    </div>
                    <div>
                      <p className="muted text-[10px] uppercase tracking-wider">Shelves</p>
                      <p className="mt-1 text-sm font-semibold">{selected.shelves.length}</p>
                    </div>
                  </div>
                </div>
                <LinkButton
                  to={`/search?q=${selected.code}`}
                  variant="ghost"
                  className="mt-4 w-full"
                  icon={<MagnifyingGlass size={16} />}
                >
                  Search in this almirah
                </LinkButton>
              </>
            ) : (
              <p className="muted mt-5 text-xs">This section has no almirahs yet.</p>
            )}
          </Card>

          {selected && (
            <Card>
              <ShelfView unit={selected} />
              <div className="mt-4 space-y-2 border-t border-base pt-4">
                {selected.shelves.map((shelf) => {
                  const count = db.files.filter((file) => file.shelfId === shelf.id).length;
                  return (
                    <div key={shelf.id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-mono">{shelf.barcode}</span>
                      <span className="muted">
                        {count} file(s) · {shelf.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <Card>
            <div className="flex items-center gap-2">
              <Buildings size={18} className="text-accent" />
              <p className="text-sm font-semibold">Files in this room</p>
            </div>
            {filesInRoom.length === 0 ? (
              <p className="muted mt-3 text-xs">No loaded registry rows point at this room.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {filesInRoom.map((file) => (
                  <li key={file.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-mono text-accent">{file.fileBarcode}</span>
                    <span className="muted truncate">{file.shelf}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="muted text-[10px] uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Card>
  );
}
