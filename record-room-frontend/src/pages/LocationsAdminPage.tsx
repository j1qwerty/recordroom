import { Buildings, FloppyDisk, Plus, Ruler, Trash } from '@phosphor-icons/react';
import { useState } from 'react';
import { rooms } from '../data/mock';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function LocationsAdminPage() {
  const [selectedRoom, setSelectedRoom] = useState(rooms[0].id);
  const room = rooms.find((item) => item.id === selectedRoom) ?? rooms[0];
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Physical configuration"
        title="Location designer"
        description="Manage the storage hierarchy and visual positions. The production backend will persist layout versions with change history."
        actions={
          <>
            <Button variant="ghost" icon={<Plus size={17} />}>
              Add unit
            </Button>
            <Button icon={<FloppyDisk size={17} />}>Save layout</Button>
          </>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[.7fr_1.3fr]">
        <Card>
          <div className="flex items-center gap-2">
            <Buildings size={18} className="text-accent" />
            <p className="text-sm font-semibold">Rooms</p>
          </div>
          <div className="mt-4 space-y-2">
            {rooms.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedRoom(item.id)}
                className={`focus-ring w-full rounded-xl border p-3 text-left ${room.id === item.id ? 'border-[var(--rr-accent)] bg-accent-soft' : 'border-base'}`}
              >
                <p className="text-sm font-semibold">{item.code}</p>
                <p className="muted mt-1 text-xs">
                  {item.name} · {item.storageUnits.length} units
                </p>
              </button>
            ))}
          </div>
        </Card>
        <Card padding={false} className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-base p-5">
            <div>
              <p className="text-sm font-semibold">{room.name}</p>
              <p className="muted mt-1 text-xs">Layout editor</p>
            </div>
            <Badge tone="info">Draft canvas</Badge>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {room.storageUnits.map((unit) => (
              <div key={unit.id} className="rounded-xl border border-base bg-[var(--rr-bg)] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold">{unit.code}</span>
                  <button
                    className="rounded p-1.5 text-[var(--rr-danger)] hover:bg-[var(--rr-surface-2)]"
                    aria-label={`Remove ${unit.code}`}
                  >
                    <Trash size={15} />
                  </button>
                </div>
                <p className="mt-2 text-xs">{unit.name}</p>
                <div className="mt-4 grid grid-cols-6 gap-1">
                  {unit.shelves.map((shelf) => (
                    <div
                      key={shelf.id}
                      className="h-5 rounded border border-base bg-[var(--rr-surface)]"
                      title={shelf.code}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-1 text-[10px] muted">
                  <Ruler size={12} /> x {unit.x}% · y {unit.y}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
