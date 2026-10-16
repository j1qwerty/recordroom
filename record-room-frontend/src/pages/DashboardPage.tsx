import {
  Archive,
  ArrowRight,
  Clock,
  Files,
  MapPin,
  MagnifyingGlass,
  WarningCircle,
  CheckCircle,
  Buildings,
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { LinkButton } from '../components/ui/Button';
import { useQuery, useService, useSession } from '../hooks/useService';
import { formatNumber } from '../lib/utils';
import type { DashboardStats, IssueRecord, TimelineEvent } from '../types';
import type { Page } from '../services/contracts';
import type { Channel } from '../services/realtime';

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
const DASHBOARD_CHANNELS: Channel[] = ['files', 'issues', 'movements', 'digitization'];

const metrics = [
  { key: 'records', label: 'Registered records', icon: Files },
  { key: 'mapped', label: 'Shelf mapped', icon: MapPin },
  { key: 'issued', label: 'Currently issued', icon: Clock },
  { key: 'digitization', label: 'Digitization approved', icon: Archive },
] as const;

export function DashboardPage() {
  const service = useService();
  const { user, allowed } = useSession();
  const { data: stats } = useQuery(() => service.dashboard.stats(), [], EMPTY_STATS, DASHBOARD_CHANNELS);
  const { data: activity } = useQuery(() => service.dashboard.activity(6), [], EMPTY_TIMELINE, ['movements']);
  const { data: overdue } = useQuery(() => service.issues.overdue(), [], EMPTY_ISSUES, ['issues']);
  const { data: occupancy } = useQuery(() => service.locations.occupancy(), [], [], ['locations', 'files']);
  const { data: registry } = useQuery(() => service.files.list({ pageSize: 1 }), [], EMPTY_FILE_PAGE);

  const rooms = occupancy.map((entry) => ({
    ...entry.room,
    sectionCount: entry.sections.length,
    almirahCount: entry.sections.reduce((sum, section) => sum + section.almirahs, 0),
    shelfCount: entry.sections.reduce((sum, section) => sum + section.shelves, 0),
  }));
  const values: Record<(typeof metrics)[number]['key'], string> = {
    records: formatNumber(stats.totalRecords),
    mapped: `${stats.mappedPercent}%`,
    issued: formatNumber(stats.issuedNow),
    digitization: `${stats.digitizationPercent}%`,
  };
  const notes: Record<(typeof metrics)[number]['key'], string> = {
    records: `${formatNumber(registry.collectionTotal ?? registry.total)} in the registry`,
    mapped: `${stats.roomCount} rooms in the location register`,
    issued: `${stats.dueToday} due today`,
    digitization: `${stats.pendingApprovals} pages awaiting review`,
  };

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent">Record Room</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Overview</h1>
          <p className="muted mt-2 max-w-2xl text-sm leading-6">
            Track registered files, physical locations, issue and return activity, and digitization work.
          </p>
          {user && <p className="muted mt-2 text-xs">Signed in as {user.displayName || user.userName} · {user.role}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton to="/search" variant="secondary" icon={<MagnifyingGlass size={17} />}>Search records</LinkButton>
          {allowed('files.create') && <LinkButton to="/files/new" icon={<Files size={17} />}>Add file</LinkButton>}
        </div>
      </section>

      <section aria-label="Registry statistics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.key} className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="muted text-sm">{metric.label}</p>
                  <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight">{values[metric.key]}</p>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Icon size={21} />
                </span>
              </div>
              <p className="muted mt-3 text-xs">{notes[metric.key]}</p>
            </Card>
          );
        })}
      </section>

      {(overdue.length > 0 || stats.pendingApprovals > 0) && (
        <section className="grid gap-3 md:grid-cols-2" aria-label="Needs attention">
          {overdue.length > 0 && (
            <Link to="/return" className="focus-ring rounded-xl border border-[color-mix(in_srgb,var(--rr-danger)_36%,var(--rr-border))] bg-[var(--rr-surface)] p-4 transition hover:bg-[var(--rr-surface-2)]">
              <div className="flex items-start gap-3">
                <WarningCircle size={22} className="mt-0.5 shrink-0 text-[var(--rr-danger)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{overdue.length} overdue receipt{overdue.length === 1 ? '' : 's'}</p>
                  <p className="muted mt-1 text-xs leading-5">Review returns and update the custody record.</p>
                </div>
                <ArrowRight size={17} className="muted" />
              </div>
            </Link>
          )}
          {stats.pendingApprovals > 0 && (
            <Link to="/digitization" className="focus-ring rounded-xl border border-base bg-[var(--rr-surface)] p-4 transition hover:bg-[var(--rr-surface-2)]">
              <div className="flex items-start gap-3">
                <Clock size={22} className="mt-0.5 shrink-0 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{stats.pendingApprovals} page{stats.pendingApprovals === 1 ? '' : 's'} waiting for review</p>
                  <p className="muted mt-1 text-xs leading-5">Open digitization to review submitted scans.</p>
                </div>
                <ArrowRight size={17} className="muted" />
              </div>
            </Link>
          )}
        </section>
      )}

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Card padding={false} className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base p-5">
            <div>
              <h2 className="text-base font-semibold">Physical locations</h2>
              <p className="muted mt-1 text-xs">Rooms and storage capacity at a glance</p>
            </div>
            <Link to="/admin/locations" className="focus-ring text-sm font-semibold text-accent">Manage locations</Link>
          </div>
          {rooms.length === 0 ? (
            <div className="p-7 text-center">
              <Buildings size={26} className="mx-auto text-accent" />
              <p className="mt-3 text-sm font-semibold">No rooms configured</p>
              <p className="muted mt-1 text-xs">Add a room to map the physical storage structure.</p>
              {allowed('locations.edit') && <Link to="/admin/locations" className="mt-3 inline-flex text-sm font-semibold text-accent">Add room <ArrowRight size={15} className="ml-1" /></Link>}
            </div>
          ) : (
            <div className="divide-y divide-[var(--rr-border)]">
              {rooms.slice(0, 6).map((room) => {
                const percent = room.capacity > 0 ? Math.min(100, Math.round((room.occupancy / room.capacity) * 100)) : 0;
                return (
                  <Link key={room.id} to={`/rooms/${room.id}`} className="focus-ring block p-4 transition hover:bg-[var(--rr-bg)] sm:px-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{room.code} <span className="font-normal muted">· {room.name}</span></p>
                        <p className="muted mt-1 text-xs">{[room.building, room.floor].filter(Boolean).join(' · ') || 'Location details not set'} · {room.sectionCount} sections · {room.almirahCount} almirahs</p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold tabular-nums">{percent}%</span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--rr-surface-2)]">
                      <div className="h-full rounded-full bg-[var(--rr-accent)]" style={{ width: `${percent}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        <Card padding={false} className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-base p-5">
            <div>
              <h2 className="text-base font-semibold">Recent activity</h2>
              <p className="muted mt-1 text-xs">Latest recorded changes</p>
            </div>
            <Link to="/movement" className="focus-ring text-sm font-semibold text-accent">View all</Link>
          </div>
          {activity.length === 0 ? (
            <p className="muted p-5 text-sm">No recent activity to show.</p>
          ) : (
            <ol className="divide-y divide-[var(--rr-border)]">
              {activity.map((event) => (
                <li key={event.id} className="flex gap-3 p-4 sm:px-5">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                    <CheckCircle size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p className="text-sm font-medium">{event.label}</p>
                      <span className="muted text-xs">{event.date}</span>
                    </div>
                    <p className="muted mt-1 text-xs leading-5">{event.detail}</p>
                    <p className="mt-1 text-xs text-accent">{event.actor}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </section>

      <section>
        <h2 className="text-base font-semibold">Common tasks</h2>
        <p className="muted mt-1 text-sm">Go straight to the desk you need.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Find a record', detail: 'Search by barcode or subject', href: '/search', icon: MagnifyingGlass, permission: 'files.view' as const },
            { title: 'Issue a file', detail: 'Record a file handover', href: '/issue', icon: Files, permission: 'issue.issue' as const },
            { title: 'Return a file', detail: 'Close an open receipt', href: '/return', icon: Clock, permission: 'issue.return' as const },
            { title: 'View map uploads', detail: 'Open scanned maps and copies', href: '/admin/maps', icon: MapPin, permission: 'files.view' as const },
          ].filter((action) => allowed(action.permission)).map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} to={action.href} className="focus-ring flex items-center gap-3 rounded-xl border border-base bg-[var(--rr-surface)] p-4 transition hover:bg-[var(--rr-surface-2)]">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent"><Icon size={20} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{action.title}</span>
                  <span className="muted mt-1 block text-xs">{action.detail}</span>
                </span>
                <ArrowRight size={16} className="muted shrink-0" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
