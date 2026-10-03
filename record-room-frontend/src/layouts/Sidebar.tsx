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
  MagnifyingGlass,
  MapTrifold,
  Package,
  Scan,
  ShieldCheck,
  SignOut,
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

const groups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/', icon: Gauge },
      { label: 'Search records', to: '/search', icon: MagnifyingGlass },
    ],
  },
  {
    title: 'Records',
    items: [
      { label: 'Record rooms', to: '/rooms', icon: MapTrifold },
      { label: 'Files', to: '/files', icon: Files },
      { label: 'Barcodes', to: '/barcodes', icon: Barcode, permission: 'barcodes.print' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Issue desk', to: '/issue', icon: ClipboardText },
      { label: 'Return desk', to: '/return', icon: Package },
      { label: 'Movement log', to: '/movement', icon: Scan },
      { label: 'Scan validation', to: '/scan', icon: Barcode },
    ],
  },
  {
    title: 'Digitization',
    items: [
      { label: 'Batches', to: '/digitization', icon: Archive },
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
      { label: 'Locations', to: '/admin/locations', icon: Database, permission: 'locations.view' },
      {
        label: 'Bulk import',
        to: '/admin/bulk-import',
        icon: UploadSimple,
        permission: 'files.bulkImport',
      },
      { label: 'Audit log', to: '/admin/audit', icon: ShieldCheck, permission: 'audit.view' },
      { label: 'Media & content', to: '/admin/media', icon: Files, permission: 'files.view' },
      { label: 'Support & inquiry', to: '/support', icon: ClipboardText },
      { label: 'Settings', to: '/settings', icon: Gear },
    ],
  },
];

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const location = useLocation();
  const { user, signOut } = useSession();

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || can(user?.role, item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[276px] flex-col border-r border-base bg-[var(--rr-surface)] transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-base px-5">
          <Link to="/" onClick={onClose} className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-[var(--rr-accent)] text-white">
              <Archive size={20} weight="bold" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">Record Room</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] muted">
                Digital twin platform
              </div>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="focus-ring rounded-lg p-2 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav
          className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4"
          aria-label="Primary navigation"
        >
          {visibleGroups.map((group) => (
            <div key={group.title} className="mb-5">
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] muted">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    item.to === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={cn(
                        'focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition',
                        active
                          ? 'bg-accent-soft font-semibold text-accent'
                          : 'muted hover:bg-[var(--rr-surface-2)] hover:text-[var(--rr-text)]',
                      )}
                    >
                      <Icon size={18} weight={active ? 'fill' : 'regular'} />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-base p-4">
          <div className="rounded-xl bg-[var(--rr-surface-2)] p-3">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[var(--rr-surface)]">
                <UserCircle size={22} className="text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">
                  {user?.displayName ?? 'Signed out'}
                </p>
                <p className="truncate text-[10px] muted">
                  {user ? `${user.role} · ${user.userName}` : 'No session'}
                </p>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="focus-ring rounded-lg p-1.5 muted hover:text-[var(--rr-danger)]"
                aria-label="Sign out"
                title="Sign out"
              >
                <SignOut size={16} />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] muted">
              <span className="size-2 rounded-full bg-emerald-500" /> Session active ·{' '}
              {user ? 'frontend demo' : 'locked'}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
