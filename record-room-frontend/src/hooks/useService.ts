/**
 * React bindings for the service layer.
 *
 * `useDb` re-renders whenever the store publishes a new snapshot, which is what
 * keeps the issue desk, movement log, audit trail and dashboard consistent with
 * each other without a single page fetching anything itself.
 */

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { service, store, type RecordRoomService } from '../services';
import { session } from '../services/impl/session';
import type { DbShape } from '../services/store';
import type { AppUser, Role } from '../types';
import type { Permission } from '../services/permissions';
import { can } from '../services/permissions';

export function useDb(): DbShape {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

export function useService(): RecordRoomService {
  return service;
}

/** Signed-in user plus role-derived permission checks. */
export function useSession() {
  // Re-render whenever the store publishes, so permissions stay in step with
  // role edits made elsewhere in the session.
  useDb();
  const user = session.get();

  const signIn = useCallback((userName: string, password: string) => {
    return service.auth.signIn(userName, password);
  }, []);

  const signOut = useCallback(() => {
    service.auth.signOut();
  }, []);

  const allowed = useCallback(
    (permission: Permission) => can(user?.role, permission),
    [user?.role],
  );

  return {
    user,
    signIn,
    signOut,
    allowed,
    has: (role: Role | undefined, p: Permission) => can(role, p),
  };
}

/**
 * Local form state helper: keeps a controlled form and exposes a `set` that
 * mirrors the field names used by the service input types.
 */
export function useForm<T extends object>(initial: T) {
  const [value, setValue] = useState<T>(initial);
  const set = useCallback(<K extends keyof T>(key: K, next: T[K]) => {
    setValue((current) => ({ ...current, [key]: next }));
  }, []);
  const reset = useCallback(() => setValue(initial), [initial]);
  return { value, set, setValue, reset };
}

/** Tracks a transient status message for form-heavy pages. */
export function useFlash() {
  const [flash, setFlash] = useState<{ tone: 'success' | 'danger' | 'info'; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 6000);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const api = useMemo(
    () => ({
      success: (text: string) => setFlash({ tone: 'success', text }),
      danger: (text: string) => setFlash({ tone: 'danger', text }),
      info: (text: string) => setFlash({ tone: 'info', text }),
      clear: () => setFlash(null),
    }),
    [],
  );

  return { flash, ...api };
}

export type { AppUser, Permission };
