import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Barcode,
  CheckCircle,
  ClipboardText,
  Clock,
  MagnifyingGlass,
  MapTrifold,
  Package,
  Plus,
  ScanSmiley,
  WarningCircle,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/Flash';
import { Spine } from '../components/ShelfSpines';
import { useQuery, useService, useSession } from '../hooks/useService';
import { formatNumber } from '../lib/utils';
import type { Permission } from '../services/permissions';
import type { DashboardStats, IssueRecord, RecordFile, Room, TimelineEvent } from '../types';
import type { Page } from '../services/contracts';
import type { Channel } from '../services/realtime';

/** Nothing here may claim a figure the service has not reported yet. */
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
const EMPTY_ROOMS: Room[] = [];
const EMPTY_FILES: Page<RecordFile> = { items: [], total: 0, page: 1, pageSize: 1 };

/** The dashboard is derived from every channel, so a write anywhere must move it. */
const DASHBOARD_CHANNELS: Channel[] = ['files', 'issues', 'movements', 'digitization'];

interface QuickAction {
  label: string;
  hint: string;
  to: string;
  icon: Icon;
  permission?: Permission;
  /** Any one of these is enough. */
  anyOf?: Permission[];
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Issue a file',
    hint: 'Lend files to a borrower',
    to: '/issue',
    icon: ClipboardText,
    permission: 'issue.issue',
  },
  {
    label: 'Return a file',
    hint: 'Check files back in',
    to: '/return',
    icon: Package,
    permission: 'issue.return',
  },
  { label: 'Scan a barcode', hint: 'Find where something is', to: '/scan', icon: ScanSmiley },
  {
    label: 'Register a file',
    hint: 'Add a new record',
    to: '/files/new',
    icon: Plus,
    permission: 'files.create',
  },
  {
    label: 'Upload a map',
    hint: 'Attach a scanned map',
    to: '/maps',
    icon: MapTrifold,
    anyOf: ['files.edit', 'digitization.upload'],
  },
  {
    label: 'Print labels',
    hint: 'Barcode stickers',
    to: '/barcodes',
    icon: Barcode,
    permission: 'barcodes.print',
  },
];

function greeting(date: Date) {
  const hour = date.getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

function occupancyOf(room: Room) {
  const shelves = room.storageUnits.flatMap((unit) => unit.shelves);
  const capacity = shelves.reduce((sum, shelf) => sum + shelf.capacity, 0);
  const used = shelves.reduce((sum, shelf) => sum + shelf.occupied, 0);
  return capacity > 0 ? used / capacity : room.capacity > 0 ? room.occupancy / room.capacity : 0;
}

export function DashboardPage() {
  const service = useService();
  const navigate = useNavigate();
  const { user, allowed } = useSession();
  const [term, setTerm] = useState('');
  const now = new Date();

  const { data: stats } = useQuery(
    () => service.dashboard.stats(),
    [],
    EMPTY_STATS,
    DASHBOARD_CHANNELS,
  );
  const { data: activity } = useQuery(() => service.dashboard.activity(6), [], EMPTY_TIMELINE, [
    'movements',
  ]);
  const { data: overdue } = useQuery(() => service.issues.overdue(), [], EMPTY_ISSUES, ['issues']);
  const { data: rooms } = useQuery(() => service.locations.listRooms(), [], EMPTY_ROOMS, [
    'locations',
    'files',
  ]);
  const { data: registry } = useQuery(() => service.files.list({ pageSize: 1 }), [], EMPTY_FILES, [
    'files',
  ]);
  const { data: missing } = useQuery(
    () => service.files.list({ status: 'Missing', pageSize: 1 }),
    [],
    EMPTY_FILES,
    ['files'],
  );
  const { data: recent } = useQuery(
    () => service.files.list({ sort: 'lastMovement', direction: 'desc', pageSize: 5 }),
    [],
    EMPTY_FILES,
    ['files', 'movements'],
  );

  const actions = QUICK_ACTIONS.filter((action) =>
    action.anyOf
      ? action.anyOf.some((permission) => allowed(permission))
      : !action.permission || allowed(action.permission),
  );

  const search = (event: FormEvent) => {
    event.preventDefault();
    const value = term.trim();
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : '/search');
  };

  // The work queue: only things that need a person. Empty means nothing is waiting.
  const attention: Array<{
    key: string;
    tone: 'danger' | 'warning' | 'info';
    title: string;
    detail: string;
    to: string;
    cta: string;
  }> = [];
  if (overdue.length > 0) {
    attention.push({
      key: 'overdue',
      tone: 'danger',
      title: `${overdue.length} overdue ${overdue.length === 1 ? 'receipt' : 'receipts'}`,
      detail: overdue
        .slice(0, 3)
        .map((issue) => `${issue.borrowerName} (due ${issue.dueAt})`)
        .join(' · '),
      to: '/return',
      cta: 'Open return desk',
    });
  }
  if (stats.dueToday > 0 && stats.dueToday !== overdue.length) {
    attention.push({
      key: 'due',
      tone: 'warning',
      title: `${stats.dueToday} ${stats.dueToday === 1 ? 'receipt' : 'receipts'} due today or earlier`,
      detail: `${stats.activeBorrowers} active ${stats.activeBorrowers === 1 ? 'borrower' : 'borrowers'} hold files right now.`,
      to: '/return',
      cta: 'See receipts',
    });
  }
  if (missing.total > 0) {
    attention.push({
      key: 'missing',
      tone: 'danger',
      title: `${missing.total} ${missing.total === 1 ? 'file is' : 'files are'} marked missing`,
      detail: 'Check the shelf and the movement log, then update the record.',
      to: '/files?status=Missing',
      cta: 'Show missing files',
    });
  }
  if (stats.pendingApprovals > 0 && allowed('digitization.review')) {
    attention.push({
      key: 'review',
      tone: 'info',
      title: `${stats.pendingApprovals} scanned ${stats.pendingApprovals === 1 ? 'page needs' : 'pages need'} review`,
      detail: 'Approve or reject uploaded pages so batches can close.',
      to: '/digitization',
      cta: 'Review pages',
    });
  }

  const tiles = [
    {
      label: 'Files in registry',
      value: formatNumber(registry.collectionTotal ?? registry.total ?? stats.totalRecords),
      note: 'All physical records',
      to: '/files',
    },
    {
      label: 'Issued right now',
      value: formatNumber(stats.issuedNow),
      note: `${stats.activeBorrowers} borrower${stats.activeBorrowers === 1 ? '' : 's'}`,
      to: '/files?status=Issued',
    },
    {
      label: 'Placed on a shelf',
      value: `${stats.mappedPercent}%`,
      note: `${stats.roomCount} room${stats.roomCount === 1 ? '' : 's'} mapped`,
      to: '/rooms',
    },
    {
      label: 'Scans approved',
      value: `${stats.digitizationPercent}%`,
      note: `${stats.pendingApprovals} awaiting review`,
      to: '/digitization',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting + search */}
      <section className="surface-flat rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
              {greeting(now)}, {user?.displayName?.split(' ')[0] ?? 'there'}
            </h1>
            <p className="muted mt-1 text-sm">
              {new Intl.DateTimeFormat('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }).format(now)}
              {user && <> · signed in as {user.role}</>}
            </p>
          </div>
        </div>

        <form onSubmit={search} role="search" className="mt-5 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <MagnifyingGlass
              size={20}
              className="muted pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
            />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              type="search"
              enterKeyHint="search"
              aria-label="Find a file"
              placeholder="Find a file by number, barcode or subject"
              className="focus-ring h-14 w-full rounded-xl border border-base bg-[var(--rr-bg)] pl-12 pr-4 text-base outline-none placeholder:text-[var(--rr-muted)]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="focus-ring inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--rr-accent)] px-6 text-[15px] font-semibold text-white hover:bg-[var(--rr-accent-strong)] dark:text-[#0d1420] sm:flex-none"
            >
              Search
            </button>
            <Link
              to="/scan"
              className="focus-ring inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border border-base bg-[var(--rr-surface)] px-5 text-[15px] font-semibold hover:bg-[var(--rr-surface-2)] sm:flex-none"
            >
              <ScanSmiley size={20} /> Scan
            </Link>
          </div>
        </form>
      </section>

      {/* Quick actions + attention */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <section aria-labelledby="quick-title">
          <h2 id="quick-title" className="mb-3 text-base font-bold">
            Start a task
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className="focus-ring surface-flat group flex min-h-[88px] flex-col justify-between gap-2 rounded-xl p-3.5 transition hover:border-[var(--rr-accent)] sm:p-4"
                >
                  <ActionIcon size={24} className="text-accent" />
                  <span>
                    <span className="block text-sm font-semibold">{action.label}</span>
                    <span className="muted block text-xs leading-4">{action.hint}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="attention-title">
          <h2 id="attention-title" className="mb-3 text-base font-bold">
            Needs attention
          </h2>
          <Card padding={false} className="overflow-hidden">
            {attention.length === 0 ? (
              <div className="flex items-start gap-3 p-5">
                <CheckCircle
                  size={24}
                  weight="fill"
                  className="shrink-0 text-[var(--rr-success)]"
                />
                <div>
                  <p className="text-sm font-semibold">You’re all caught up</p>
                  <p className="muted mt-1 text-sm leading-5">
                    Nothing is overdue, missing or waiting for review.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--rr-border)]">
                {attention.map((item) => (
                  <li key={item.key}>
                    <Link
                      to={item.to}
                      className="focus-ring flex items-start gap-3 p-4 hover:bg-[var(--rr-bg)]"
                    >
                      {item.tone === 'danger' ? (
                        <WarningCircle
                          size={22}
                          weight="fill"
                          className="mt-0.5 shrink-0 text-[var(--rr-danger)]"
                        />
                      ) : item.tone === 'warning' ? (
                        <Clock
                          size={22}
                          weight="fill"
                          className="mt-0.5 shrink-0 text-[var(--rr-warning)]"
                        />
                      ) : (
                        <CheckCircle
                          size={22}
                          weight="fill"
                          className="mt-0.5 shrink-0 text-accent"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{item.title}</span>
                        <span className="muted mt-0.5 block text-[13px] leading-5">
                          {item.detail}
                        </span>
                      </span>
                      <span className="hidden shrink-0 items-center gap-1 self-center text-[13px] font-semibold text-accent sm:inline-flex">
                        {item.cta} <ArrowRight size={14} weight="bold" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>

      {/* Numbers */}
      <section aria-label="Registry summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            to={tile.to}
            className="focus-ring surface-flat rounded-xl p-4 transition hover:border-[var(--rr-accent)]"
          >
            <p className="muted text-[13px] font-medium">{tile.label}</p>
            <p className="mt-1.5 text-2xl font-bold tracking-[-0.02em] sm:text-[28px]">
              {tile.value}
            </p>
            <p className="muted mt-1 text-xs">{tile.note}</p>
          </Link>
        ))}
      </section>

      {/* Rooms + activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <section aria-labelledby="rooms-title">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="rooms-title" className="text-base font-bold">
              Record rooms
            </h2>
            <Link to="/rooms" className="focus-ring rounded text-[13px] font-semibold text-accent">
              All rooms
            </Link>
          </div>
          <Card padding={false}>
            {rooms.length === 0 ? (
              <p className="muted p-5 text-sm">Loading rooms…</p>
            ) : (
              <ul className="divide-y divide-[var(--rr-border)]">
                {rooms.map((room) => {
                  const fill = occupancyOf(room);
                  return (
                    <li key={room.id}>
                      <Link
                        to={`/rooms/${room.id}`}
                        className="focus-ring block p-4 hover:bg-[var(--rr-bg)] sm:p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">
                              {room.name}{' '}
                              <span className="mono muted text-xs font-medium">{room.code}</span>
                            </p>
                            <p className="muted mt-0.5 text-xs">
                              {room.building} · {room.floor} · {room.storageUnits.length} almirahs
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold leading-none">
                              {Math.round(fill * 100)}%
                            </p>
                            <p className="muted mt-1 text-xs">full</p>
                          </div>
                        </div>
                        <div
                          className="mt-4 flex h-14 items-end gap-1"
                          role="img"
                          aria-label={`${room.storageUnits.length} almirahs in ${room.name}, ${Math.round(fill * 100)} percent full`}
                        >
                          {room.storageUnits.map((unit) => {
                            const capacity = unit.shelves.reduce(
                              (sum, shelf) => sum + shelf.capacity,
                              0,
                            );
                            const used = unit.shelves.reduce(
                              (sum, shelf) => sum + shelf.occupied,
                              0,
                            );
                            const unitFill = capacity > 0 ? used / capacity : 0;
                            return (
                              <div key={unit.id} className="flex h-full max-w-5 flex-1 items-end">
                                <Spine
                                  fill={unitFill}
                                  title={`${unit.code}: ${Math.round(unitFill * 100)}% full`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-base px-4 py-3 text-xs muted sm:px-5">
              <span>Each bar is one almirah:</span>
              {[
                ['Empty', 0],
                ['Filling', 1],
                ['Busy', 2],
                ['Almost full', 3],
                ['Full', 4],
              ].map(([label, tier]) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-sm"
                    style={{ background: `var(--rr-spine-${tier})` }}
                  />
                  {label}
                </span>
              ))}
            </div>
          </Card>
        </section>

        <section aria-labelledby="activity-title" className="space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 id="activity-title" className="text-base font-bold">
                Recent movement
              </h2>
              <Link
                to="/movement"
                className="focus-ring rounded text-[13px] font-semibold text-accent"
              >
                Full log
              </Link>
            </div>
            <Card padding={false}>
              {activity.length === 0 ? (
                <p className="muted p-5 text-sm">No movement recorded yet.</p>
              ) : (
                <ul className="divide-y divide-[var(--rr-border)]">
                  {activity.map((event) => (
                    <li key={event.id} className="flex gap-3 p-4">
                      <span
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${
                          event.tone === 'danger'
                            ? 'bg-[var(--rr-danger)]'
                            : event.tone === 'warning'
                              ? 'bg-[var(--rr-warning)]'
                              : event.tone === 'success'
                                ? 'bg-[var(--rr-success)]'
                                : 'bg-[var(--rr-accent)]'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-sm font-semibold">{event.label}</p>
                          <span className="muted shrink-0 text-xs">{event.date}</span>
                        </div>
                        <p className="muted mt-0.5 text-[13px] leading-5">{event.detail}</p>
                        <p className="muted mt-0.5 text-xs">{event.actor}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {recent.items.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold">Recently moved files</h2>
                <Link
                  to="/files"
                  className="focus-ring rounded text-[13px] font-semibold text-accent"
                >
                  All files
                </Link>
              </div>
              <Card padding={false}>
                <ul className="divide-y divide-[var(--rr-border)]">
                  {recent.items.map((file) => (
                    <li key={file.id}>
                      <Link
                        to={`/files/${file.id}`}
                        className="focus-ring flex items-center gap-3 p-4 hover:bg-[var(--rr-bg)]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="mono truncate text-[13px] font-semibold text-accent">
                            {file.fileNumber}
                          </p>
                          <p className="muted truncate text-[13px]">{file.subject}</p>
                        </div>
                        <StatusBadge status={file.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
