import { NavLink, Outlet } from 'react-router-dom';
import {
  Buildings,
  Database,
  Files,
  IdentificationCard,
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
  {
    to: '/admin/employees',
    label: 'Employees',
    icon: IdentificationCard,
    permission: 'employees.view',
  },
  { to: '/admin/locations', label: 'Locations', icon: Database, permission: 'locations.view' },
  {
    to: '/admin/bulk-import',
    label: 'Bulk import',
    icon: UploadSimple,
    permission: 'files.bulkImport',
  },
  { to: '/admin/maps', label: 'Maps & copies', icon: Files, permission: 'files.view' },
  { to: '/admin/audit', label: 'Audit & logins', icon: ShieldCheck, permission: 'audit.view' },
];

/**
 * Administration layout.
 *
 * Kept separate from `AppShell` so administration reads as its own surface with
 * its own navigation, per `AGENTS.md`. Filtering the nav by permission is a
 * convenience only â€” `RouteGuards` still blocks the route itself.
 */
export function AdminLayout() {
  const { user } = useSession();
  const visible = adminNav.filter((item) => can(user?.role, item.permission));

  return (
    <div className="grid gap-6 lg:grid-cols-[228px_1fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="surface-flat rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent">
              <Buildings size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                Administration
              </p>
              <p className="muted truncate text-[11px]">{user?.role ?? 'No session'}</p>
            </div>
          </div>
          <nav className="mt-4 space-y-1" aria-label="Administration">
            {visible.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      'focus-ring flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition',
                      isActive
                        ? 'bg-accent-soft text-accent'
                        : 'muted hover:bg-[var(--rr-surface-2)] hover:text-[var(--rr-text)]',
                    )
                  }
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--rr-bg)] p-3 text-[11px] muted">
            <UserCircle size={16} className="text-accent" />
            Signed in as {user?.displayName ?? 'â€”'}
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
