import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Archive,
  Barcode,
  ChartBar,
  ClipboardText,
  Database,
  Files,
  Gauge,
  Gear,
  IdentificationCard,
  LinkSimple,
  MagnifyingGlass,
  MapTrifold,
  Package,
  Path,
  Question,
  ScanSmiley,
  ShieldCheck,
  SignOut,
  Stack,
  UploadSimple,
  UserCircle,
  X,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { useSession } from '../hooks/useService';
import { can, type Permission } from '../services/permissions';

interface NavItem {
  label: string;
  to: string;
  icon: Icon;
  permission?: Permission;
}

/**
 * Navigation is grouped by what a person is trying to do, not by how the system
 * is built: find things, run a desk, look after the rooms, digitize, administer.
 */
const navGroups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Find & manage',
    items: [
      { label: 'Dashboard', to: '/', icon: Gauge },
      { label: 'Find a record', to: '/search', icon: MagnifyingGlass },
      { label: 'Files', to: '/files', icon: Files },
      { label: 'Maps', to: '/maps', icon: MapTrifold, permission: 'files.view' },
    ],
  },
  {
    title: 'Desks',
    items: [
      { label: 'Issue a file', to: '/issue', icon: ClipboardText, permission: 'issue.issue' },
      { label: 'Return a file', to: '/return', icon: Package, permission: 'issue.return' },
      { label: 'Scan a barcode', to: '/scan', icon: ScanSmiley },
      { label: 'Movement log', to: '/movement', icon: Path },
    ],
  },
  {
    title: 'Rooms & labels',
    items: [
      { label: 'Record rooms', to: '/rooms', icon: Stack },
      { label: 'Barcode labels', to: '/barcodes', icon: Barcode, permission: 'barcodes.print' },
    ],
  },
  {
    title: 'Digitization',
    items: [
      { label: 'Scan batches', to: '/digitization', icon: Archive },
      { label: 'Reports', to: '/reports', icon: ChartBar, permission: 'reports.view' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users & roles', to: '/admin/users', icon: UserCircle, permission: 'users.view' },
      {
        label: 'Employees',
        to: '/admin/employees',
        icon: IdentificationCard,
        permission: 'employees.view',
      },
      {
        label: 'Room layout',
        to: '/admin/locations',
        icon: Database,
        permission: 'locations.view',
      },
      {
        label: 'Bulk import',
        to: '/admin/bulk-import',
        icon: UploadSimple,
        permission: 'files.bulkImport',
      },
      { label: 'Media links', to: '/admin/media', icon: LinkSimple, permission: 'files.view' },
      { label: 'Audit log', to: '/admin/audit', icon: ShieldCheck, permission: 'audit.view' },
    ],
  },
];

const footerLinks: NavItem[] = [
  { label: 'Help & support', to: '/support', icon: Question },
  { label: 'Settings', to: '/settings', icon: Gear },
];

export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-lg bg-[var(--rr-rail-active)] text-white"
      style={{ width: size, height: size }}
    >
      <Archive size={Math.round(size * 0.55)} weight="bold" />
    </div>
  );
}

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const location = useLocation();
  const { user, signOut } = useSession();

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || can(user?.role, item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const link = (item: NavItem) => {
    const active = isActive(item.to);
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={onClose}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'focus-ring flex min-h-10 items-center gap-3 rounded-lg px-3 text-[14px] transition',
          active
            ? 'bg-[var(--rr-rail-active)] font-semibold text-white'
            : 'text-[var(--rr-rail-muted)] hover:bg-[var(--rr-rail-2)] hover:text-white',
        )}
      >
        <Icon size={18} weight={active ? 'fill' : 'regular'} />
        {item.label}
      </NavLink>
    );
  };

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="animate-fade fixed inset-0 z-40 bg-slate-950/55 lg:hidden"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[272px] max-w-[86vw] flex-col bg-[var(--rr-rail)] text-[var(--rr-rail-text)] transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <Link to="/" onClick={onClose} className="focus-ring flex items-center gap-3 rounded-lg">
            <BrandMark />
            <div className="leading-tight">
              <div className="text-[15px] font-bold tracking-tight text-white">Record Room</div>
              <div className="text-[11px] text-[var(--rr-rail-muted)]">Records management</div>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="focus-ring grid size-10 place-items-center rounded-lg text-[var(--rr-rail-muted)] hover:bg-[var(--rr-rail-2)] lg:hidden"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4" aria-label="Primary">
          {visibleGroups.map((group) => (
            <div key={group.title} className="mt-5 first:mt-2">
              <div className="px-3 pb-1.5 text-xs font-semibold text-[var(--rr-rail-muted)]">
                {group.title}
              </div>
              <div className="space-y-0.5">{group.items.map(link)}</div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3">
          <div className="space-y-0.5">{footerLinks.map(link)}</div>
          <div className="mt-3 flex items-center gap-3 rounded-lg bg-[var(--rr-rail-2)] p-2.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--rr-rail-active)] text-sm font-bold text-white">
              {(user?.displayName ?? '?').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-semibold text-white">
                {user?.displayName ?? 'Signed out'}
              </p>
              <p className="truncate text-xs text-[var(--rr-rail-muted)]">{user?.role}</p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="focus-ring grid size-9 place-items-center rounded-lg text-[var(--rr-rail-muted)] transition-colors hover:bg-[var(--rr-danger)] hover:text-white"
              aria-label="Sign out"
              title="Sign out"
            >
              <SignOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
