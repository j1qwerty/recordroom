import {
  ArrowRight,
  Archive,
  CheckCircle,
  Clock,
  Files,
  MagnifyingGlass,
  MapPin,
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { PretextMasonry } from '../components/PretextMasonry';
import { Card } from '../components/ui/Card';
import { LinkButton } from '../components/ui/Button';
import { StatCard } from '../components/ui/StatCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { DecorativeField } from '../components/DecorativeField';
import { RoomMap } from '../components/RoomMap';
import { rooms, dashboardEvents, galleryItems } from '../data/mock';
import { formatNumber } from '../lib/utils';

export function DashboardPage() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-base bg-[var(--rr-surface)] p-6 shadow-sm md:p-8 lg:p-10">
        <DecorativeField variant={2} className="-right-8 -top-10 w-56" />
        <DecorativeField variant={7} className="bottom-0 left-0 w-40 opacity-25" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-base bg-[var(--rr-bg)] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-accent">
              <span className="size-2 rounded-full bg-emerald-500" /> Live operations view
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.05em] md:text-6xl">
              Know the record. Know the room. Know the history.
            </h1>
            <p className="muted mt-5 max-w-2xl text-base leading-7">
              A unified operational view of physical files, digital copies, locations, issue/return
              activity and digitization progress.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton to="/search" icon={<MagnifyingGlass size={18} />}>
                Search records
              </LinkButton>
              <LinkButton to="/rooms" variant="ghost" icon={<MapPin size={18} />}>
                Explore rooms
              </LinkButton>
            </div>
          </div>
          <div className="surface-flat relative overflow-hidden rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Current record-room footprint</p>
                <p className="muted text-xs">SITE-001 · BLD-001 · Floor 02</p>
              </div>
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                76% mapped
              </span>
            </div>
            <RoomMap room={rooms[0]} compact />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow="System pulse"
          title="Today at a glance"
          description="These values are illustrative frontend data and are ready to connect to API responses."
        />
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Physical records"
          value={formatNumber(2478450)}
          note="+18,240 verified this month"
          icon={<Files size={22} />}
        />
        <StatCard
          label="Mapped files"
          value="96.8%"
          note="+2.4% since last reconciliation"
          icon={<MapPin size={22} />}
        />
        <StatCard
          label="Issued now"
          value="148"
          note="12 due for return today"
          tone="warning"
          icon={<Clock size={22} />}
        />
        <StatCard
          label="Digitization"
          value="64.2%"
          note="Batch throughput above target"
          icon={<Archive size={22} />}
        />
      </div>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Room utilization</p>
              <p className="muted mt-1 text-xs">Occupancy across mapped storage areas</p>
            </div>
            <Link className="text-xs font-semibold text-accent" to="/rooms">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {rooms.map((room) => (
              <Link
                key={room.id}
                to={`/rooms/${room.id}`}
                className="block rounded-xl border border-base p-4 transition hover:bg-[var(--rr-surface-2)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">
                      {room.code} · {room.name}
                    </p>
                    <p className="muted mt-1 text-xs">
                      {room.building} · {room.floor} · {room.storageUnits.length} storage units
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {Math.round((room.occupancy / room.capacity) * 100)}%
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--rr-surface-2)]">
                  <div
                    className="h-full rounded-full bg-[var(--rr-accent)]"
                    style={{ width: `${(room.occupancy / room.capacity) * 100}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Operational activity</p>
              <p className="muted mt-1 text-xs">Latest auditable events</p>
            </div>
            <Link className="text-xs font-semibold text-accent" to="/admin/audit">
              Open audit
            </Link>
          </div>
          <div className="space-y-4">
            {dashboardEvents.map((event) => (
              <div key={event.id} className="flex gap-3">
                <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                  <CheckCircle size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{event.label}</p>
                    <span className="text-[10px] muted">{event.date}</span>
                  </div>
                  <p className="muted mt-0.5 text-xs">{event.detail}</p>
                  <p className="mt-1 text-[10px] text-accent">{event.actor}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <SectionHeader
          eyebrow="Knowledge surface"
          title="Operational patterns"
          description="A small editorial layer for training, implementation updates and record-room insights. The same module can later be driven from Firestore."
        />
      </section>
      <PretextMasonry
        items={galleryItems}
        columnWidth={320}
        gap={20}
        getItemText={(item) => `${item.title} ${item.text}`}
        getItemMeta={(item) => ({ headerText: item.title, extraHeight: 120, imageHeight: 80 })}
        renderItem={(item) => (
          <article className="overflow-hidden rounded-2xl border border-base bg-[var(--rr-surface)] p-5">
            <div className="mb-4 h-20 rounded-xl bg-gradient-to-br from-[var(--rr-surface-2)] to-accent-soft">
              <div className="h-full p-4">
                <div className="h-1 w-16 rounded-full bg-[var(--rr-accent)]/45" />
                <div className="mt-3 h-1 w-28 rounded-full bg-[var(--rr-accent)]/20" />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">Field note</p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight">{item.title}</h3>
            <p className="muted mt-2 text-sm leading-6">{item.text}</p>
            <Link
              to="/reports"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent"
            >
              Open related report <ArrowRight size={14} />
            </Link>
          </article>
        )}
        className="w-full"
      />
      <div className="rounded-2xl border border-base bg-accent-soft p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">Need help with a physical record?</p>
            <p className="muted mt-1 text-sm">
              Open the locate flow and scan or enter a file ID to get the current physical path.
            </p>
          </div>
          <LinkButton to="/search" variant="secondary" icon={<MagnifyingGlass size={17} />}>
            Locate a file
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
