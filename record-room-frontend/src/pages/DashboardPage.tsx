import {
  Archive,
  ArrowRight,
  CheckCircle,
  Clock,
  Files,
  MagnifyingGlass,
  MapPin,
  WarningCircle,
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { PretextMasonry } from '../components/PretextMasonry';
import { Card } from '../components/ui/Card';
import { LinkButton } from '../components/ui/Button';
import { StatCard } from '../components/ui/StatCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { DecorativeField } from '../components/DecorativeField';
import { RoomMap } from '../components/RoomMap';
import { useQuery, useService } from '../hooks/useService';
import { galleryItems } from '../data/mock';
import { formatNumber } from '../lib/utils';
import type { DashboardStats, IssueRecord, TimelineEvent } from '../types';
import type { Page } from '../services/contracts';
import type { Channel } from '../services/realtime';

/**
 * Placeholders for the first paint. Every figure on this page comes from the
 * API, so nothing here may claim a number the service has not reported yet.
 */
const EMPTY_STATS: DashboardStats = {
  totalRecords: 0,
  mappedPercent: 0,
  issuedNow: 0,
  dueToday: 0,
  digitizationPercent: 0,
  overdueCount: 0,
  roomCount: 0,
  activeBorrowers: 0,
  pendingApprovals: 0,
};
const EMPTY_TIMELINE: TimelineEvent[] = [];
const EMPTY_ISSUES: IssueRecord[] = [];
const EMPTY_FILE_PAGE: Page<never> = { items: [], total: 0, page: 1, pageSize: 1 };

/**
 * The dashboard is derived from every channel, so a write anywhere must move
 * these cards. Declared once at module scope: the hook keys on the joined names,
 * but a stable constant keeps the intent obvious.
 */
const DASHBOARD_CHANNELS: Channel[] = ['files', 'issues', 'movements', 'digitization'];

export function DashboardPage() {
  const service = useService();

  const { data: stats } = useQuery(
    () => service.dashboard.stats(),
    [],
    EMPTY_STATS,
    DASHBOARD_CHANNELS,
  );
  const { data: activity } = useQuery(() => service.dashboard.activity(5), [], EMPTY_TIMELINE, [
    'movements',
  ]);
  const { data: overdue } = useQuery(() => service.issues.overdue(), [], EMPTY_ISSUES, ['issues']);

  // One read feeds both the footprint panel and the utilisation list. The API
  // owns the room/section/almirah counts, so they are read from its roll-up
  // rather than from a client-side snapshot.
  const { data: occupancy } = useQuery(
    () => service.locations.occupancy(),
    [],
    [],
    ['locations', 'files'],
  );
  const rooms = occupancy.map((entry) => ({
    ...entry.room,
    sectionCount: entry.sections.length,
    almirahCount: entry.sections.reduce((sum, row) => sum + row.almirahs, 0),
  }));
  const firstRoom = rooms[0];

  // The "loaded in this browser" note used to count rows in the local snapshot.
  // Under the HTTP adapter that snapshot is empty, so the registry's own row
  // count is the honest replacement.
  const { data: registry } = useQuery(
    () => service.files.list({ pageSize: 1 }),
    [],
    EMPTY_FILE_PAGE,
  );

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
          {firstRoom && (
            <div className="surface-flat relative overflow-hidden rounded-2xl p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Current record-room footprint</p>
                  <p className="muted text-xs">
                    {firstRoom.building} Ã‚Â· {firstRoom.floor} Ã‚Â· {rooms.length} rooms mapped
                  </p>
                </div>
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                  {Math.round((firstRoom.occupancy / firstRoom.capacity) * 100)}% mapped
                </span>
              </div>
              <RoomMap room={firstRoom} compact />
            </div>
          )}
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow="System pulse"
          title="Today at a glance"
          description="Aggregated from the same collections the desks write to, so these numbers cannot drift from the tables."
        />
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Physical records"
          value={formatNumber(stats.totalRecords)}
          note={`${formatNumber(registry.collectionTotal ?? registry.total)} indexed in the registry`}
          icon={<Files size={22} />}
        />
        <StatCard
          label="Mapped to a shelf"
          value={`${stats.mappedPercent}%`}
          note={`${stats.roomCount} rooms Ã‚Â· sections and almirahs mapped`}
          icon={<MapPin size={22} />}
        />
        <StatCard
          label="Issued now"
          value={formatNumber(stats.issuedNow)}
          note={`${stats.dueToday} receipt(s) due or overdue`}
          tone="warning"
          icon={<Clock size={22} />}
        />
        <StatCard
          label="Digitization approved"
          value={`${stats.digitizationPercent}%`}
          note={`${stats.pendingApprovals} page(s) awaiting review`}
          icon={<Archive size={22} />}
        />
      </div>

      {overdue.length > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-[color-mix(in_srgb,var(--rr-danger)_40%,transparent)] p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-3">
            <WarningCircle size={22} className="mt-0.5 shrink-0 text-[var(--rr-danger)]" />
            <div>
              <p className="text-sm font-semibold">
                {overdue.length} receipt(s) overdue Ã‚Â· {stats.activeBorrowers} active borrower(s)
              </p>
              <p className="muted mt-1 text-sm leading-6">
                {overdue
                  .slice(0, 3)
                  .map(
                    (issue) => `${issue.receiptNumber} (${issue.borrowerName}, due ${issue.dueAt})`,
                  )
                  .join(' Ã‚Â· ')}
              </p>
            </div>
          </div>
          <Link to="/return" className="focus-ring text-xs font-semibold text-accent">
            Open the return desk
          </Link>
        </div>
      )}

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
                      {room.code} Ã‚Â· {room.name}
                    </p>
                    <p className="muted mt-1 text-xs">
                      {room.building} Ã‚Â· {room.floor} Ã‚Â· {room.sectionCount} sections Ã‚Â·{' '}
                      {room.almirahCount} almirahs
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
              <p className="muted mt-1 text-xs">Latest movement events</p>
            </div>
            <Link className="text-xs font-semibold text-accent" to="/movement">
              Movement log
            </Link>
          </div>
          <div className="space-y-4">
            {activity.map((event) => (
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
          description="A small editorial layer for training, implementation updates and record-room insights."
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
              Scan a barcode or enter a file ID to get the current physical path.
            </p>
          </div>
          <LinkButton to="/scan" variant="secondary" icon={<MagnifyingGlass size={17} />}>
            Open the scanner
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
