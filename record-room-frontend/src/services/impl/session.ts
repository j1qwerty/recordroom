/**
 * Current-session holder.
 *
 * The actor recorded on every audit entry and movement event comes from here.
 * A real backend derives the actor from the authenticated token instead; this
 * module is the client-side stand-in.
 *
 * Observable on purpose. The route guard has to re-evaluate the moment the
 * session changes, and it cannot rely on the store for that: signing out over
 * HTTP writes nothing to the store, so a guard subscribed only to the store
 * would keep rendering the app after the token was gone.
 */

import type { AppUser, Role } from '../../types';

const SESSION_KEY = 'rr-session';

let current: AppUser | null = null;
const listeners = new Set<() => void>();

function readStored(): AppUser | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const candidate = parsed as Partial<AppUser>;
    return typeof candidate.id === 'string' && typeof candidate.role === 'string'
      ? (candidate as AppUser)
      : null;
  } catch {
    return null;
  }
}

function writeStored(user: AppUser | null) {
  if (typeof localStorage === 'undefined') return;
  try {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage unavailable: the session still works for this tab.
  }
}

export const session = {
  get: (): AppUser | null => current ?? readStored(),
  set(user: AppUser | null) {
    current = user;
    writeStored(user);
    // Announced after the value is set, so a listener that reads get() during
    // its callback already sees the new session.
    listeners.forEach((listener) => listener());
  },
  /**
   * Subscribes to sign-in and sign-out.
   *
   * Returns the unsubscribe function, matching the `useSyncExternalStore`
   * contract, so React can attach without a wrapper.
   */
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  /** Display name for audit rows; falls back to `system` for seeded events. */
  actorName(): string {
    return current?.displayName ?? current?.userName ?? 'system';
  },
  userName(): string {
    return current?.userName ?? 'system';
  },
  role(): Role {
    return current?.role ?? 'Operator';
  },
  isSignedIn(): boolean {
    return session.get() !== null;
  },
};
