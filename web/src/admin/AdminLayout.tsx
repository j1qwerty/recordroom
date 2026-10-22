import { NavLink, Outlet } from 'react-router-dom';
import {
  Buildings,
  Database,
  Files,
  IdentificationCard,
  LinkSimple,
  ShieldCheck,
  UploadSimple,
  UserCircle,
  UsersThree,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { useSession } from '../hooks/useService';
import { can, type Permission } from '../services/permissions';

const adminNav: Array<{
  to: string;
  label: string;
  icon: typeof Database;
  permission: Permission;
}> = [
  { to: '/admin/users', label: 'Users & roles', icon: UsersThree, permission: 'users.view' },
  { to: '/admin/employees', label: 'Employees', icon: IdentificationCard, permission: 'employees.view' },
  { to: '/admin/locations', label: 'Locations', icon: Database, permission: 'locations.view' },
  { to: '/admin/bulk-import', label: 'Bulk import', icon: UploadSimple, permission: 'files.bulkImport' },
  { to: '/admin/maps', label: 'Maps & copies', icon: Files, permission: 'files.view' },
  { to: '/admin/media', label: 'Media links', icon: LinkSimple, permission: 'files.view' },
  { to: '/admin/audit', label: 'Audit & logins', icon: ShieldCheck, permission: 'audit.view' },
];

/** Administration uses a top tab strip; route guards still enforce permissions. */
export function AdminLayout() {
  const { user } = useSession();
  const visible = adminNav.filter((item) => can(user?.role, item.permission));

  return (
    <div className="min-w-0 space-y-5">
      <div className="surface-flat rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
              <Buildings size={19} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Administration</p>
              <h1 className="mt-1 text-lg font-semibold tracking-tight">Manage RecordRoom</h1>
              <p className="muted mt-0.5 text-xs">{user?.role ?? 'No session'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[var(--rr-bg)] px-3 py-2 text-xs muted">
            <UserCircle size={16} className="text-accent" />
            <span>Signed in as <strong className="font-semibold text-[var(--rr-text)]">{user?.displayName ?? '—'}</strong></span>
          </div>
        </div>
        <nav className="mt-5 flex gap-2 overflow-x-auto border-t border-base pt-4" aria-label="Administration sections">
          {visible.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    'focus-ring inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition',
                    isActive
                      ? 'border-[var(--rr-accent)] bg-accent-soft text-accent'
                      : 'border-transparent muted hover:border-base hover:bg-[var(--rr-surface-2)] hover:text-[var(--rr-text)]',
                  )
                }
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
