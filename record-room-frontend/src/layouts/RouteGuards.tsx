import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { session } from '../services/impl/session';
import { useDb } from '../hooks/useService';
import { can, type Permission } from '../services/permissions';

/**
 * Client-side session gate.
 *
 * `useDb()` is subscribed deliberately: a page reached by deep link must
 * re-evaluate the session after a sign-out elsewhere in the app. This is UX
 * gating only — `docs/SECURITY.md` requires the .NET 10 API to authorize every
 * request independently.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  useDb();
  const location = useLocation();
  const user = session.get();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

export function RequirePermission({
  permission,
  children,
  fallback,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  useDb();
  const user = session.get();
  if (!user) return <Navigate to="/login" replace />;
  if (can(user.role, permission)) return <>{children}</>;
  return (
    <>
      {fallback ?? (
        <div className="surface-flat rounded-2xl p-6 text-sm">
          <p className="font-semibold">Not available for your role</p>
          <p className="muted mt-2 leading-6">
            The <span className="font-mono text-xs">{permission}</span> capability is not granted to{' '}
            <span className="font-semibold">{user.role}</span>. Ask an administrator if you need it.
          </p>
        </div>
      )}
    </>
  );
}
