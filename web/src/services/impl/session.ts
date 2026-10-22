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

/**
 * Last raw string that was parsed, and the object it produced.
 *
 * `session.get` is the `getSnapshot` for `useSyncExternalStore` in the route
 * guard and in `useSession`, and React requires that snapshot to be referentially
 * stable across calls. Parsing localStorage on every call returned a brand new
 * object each time, so React saw the session as changed on every render and the
 * app looped until it hit React's maximum update depth (error #185). This cache
 * is keyed on the raw string, so it re-parses exactly when storage really
 * changes -- including a change made in another tab -- and never otherwise.
 */
let lastParsedRaw: string | null = null;
let lastParsedUser: AppUser | null = null;

function parseStored(raw: string | null): AppUser | null {
  if (raw === lastParsedRaw) return lastParsedUser;

  lastParsedRaw = raw;
  if (!raw) {
    lastParsedUser = null;
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      lastParsedUser = null;
      return null;
    }
    const candidate = parsed as Partial<AppUser>;
    lastParsedUser =
      typeof candidate.id === 'string' && typeof candidate.role === 'string'
        ? (candidate as AppUser)
        : null;
  } catch {
    lastParsedUser = null;
  }

  return lastParsedUser;
}

function readStored(): AppUser | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return parseStored(localStorage.getItem(SESSION_KEY));
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
