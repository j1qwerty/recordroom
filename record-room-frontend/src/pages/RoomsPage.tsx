import { Buildings, MapPin, Plus, ArrowRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { rooms } from '../data/mock';
import { PageHeader } from '../components/ui/PageHeader';
import { LinkButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { RoomMap } from '../components/RoomMap';

export function RoomsPage() {
  return (
    <div className="relative space-y-8">
      <div className="pointer-events-none absolute right-0 top-0 w-40 opacity-20">
        <img src="/decorative/geo-06.svg" alt="" className="w-full" />
      </div>
      <PageHeader
        kicker="Physical model"
        title="Record rooms"
        description="Browse from site and building down to an almirah and shelf. Every visual object maps to a persistent storage entity."
        actions={
          <LinkButton to="/admin/locations" icon={<Plus size={17} />}>
            Manage locations
          </LinkButton>
        }
      />
      <div className="grid gap-5 xl:grid-cols-2">
        {rooms.map((room) => (
          <Card key={room.id} padding={false} className="overflow-hidden">
            <div className="border-b border-base p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Buildings size={18} className="text-accent" />
                    <h2 className="font-semibold">
                      {room.code} · {room.name}
                    </h2>
                  </div>
                  <p className="muted mt-2 text-xs">
                    {room.building} · {room.floor}
                  </p>
                </div>
                <Badge tone={room.status === 'Operational' ? 'success' : 'warning'}>
                  {room.status}
                </Badge>
              </div>
            </div>
            <div className="p-4">
              <RoomMap room={room} compact />
            </div>
            <div className="grid grid-cols-3 divide-x divide-[var(--rr-border)] border-t border-base">
              <div className="p-4">
                <p className="muted text-[10px] uppercase tracking-[0.12em]">Occupancy</p>
                <p className="mt-1 font-semibold">
                  {Math.round((room.occupancy / room.capacity) * 100)}%
                </p>
              </div>
              <div className="p-4">
                <p className="muted text-[10px] uppercase tracking-[0.12em]">Units</p>
                <p className="mt-1 font-semibold">{room.storageUnits.length}</p>
              </div>
              <div className="p-4">
                <Link
                  to={`/rooms/${room.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent"
                >
                  Open <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="rounded-2xl border border-base bg-accent-soft p-5">
        <div className="flex gap-3">
          <MapPin className="mt-0.5 shrink-0 text-accent" size={20} />
          <div>
            <p className="text-sm font-semibold">Location principle</p>
            <p className="muted mt-1 max-w-3xl text-sm leading-6">
              RF IDs identify files permanently. Location codes describe where they are now. A
              physical move never changes the file identity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
