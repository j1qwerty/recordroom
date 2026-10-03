import { ArrowLeft, CheckCircle, Cube, MagnifyingGlass } from '@phosphor-icons/react';
import { useNavigate, useParams } from 'react-router-dom';
import { rooms } from '../data/mock';
import { RoomMap } from '../components/RoomMap';
import { ShelfView } from '../components/ShelfView';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button, LinkButton } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { useState } from 'react';

export function RoomDetailPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const room = rooms.find((item) => item.id === roomId) ?? rooms[0];
  const [selectedId, setSelectedId] = useState(room.storageUnits[3]?.id ?? room.storageUnits[0].id);
  const selected = room.storageUnits.find((unit) => unit.id === selectedId) ?? room.storageUnits[0];
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
        description="Explore the room visually, select an almirah, then drill into shelf-level occupancy and file position."
        actions={
          <LinkButton to="/search" icon={<MagnifyingGlass size={17} />}>
            Locate file
          </LinkButton>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
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
            selectedId={selectedId}
            onSelect={(unit) => setSelectedId(unit.id)}
          />
        </Card>
        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Selected storage unit</p>
                <p className="muted mt-1 text-xs">Click an almirah in the map</p>
              </div>
              <CheckCircle className="text-accent" size={19} />
            </div>
            <div className="mt-5 rounded-xl bg-[var(--rr-bg)] p-4">
              <p className="text-lg font-semibold">{selected.name}</p>
              <p className="muted mt-1 text-xs">
                {selected.code} · {selected.type}
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
            <div className="mt-4">
              <Button
                variant="ghost"
                className="w-full"
                icon={<MagnifyingGlass size={16} />}
                onClick={() => navigate(`/search?q=${selected.code}`)}
              >
                Search in this unit
              </Button>
            </div>
          </Card>
          <Card>
            <ShelfView
              unit={selected}
              activeShelf={selected.code === 'A-012' ? 'A-012-S-05' : undefined}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
