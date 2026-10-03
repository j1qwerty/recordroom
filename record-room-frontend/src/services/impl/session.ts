/**
 * Current-session holder.
 *
 * The actor recorded on every audit entry and movement event comes from here.
 * A real backend derives the actor from the authenticated token instead; this
 * module is the client-side stand-in.
 */

import type { AppUser, Role } from '../../types';

const SESSION_KEY = 'rr-session';

let current: AppUser | null = null;

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
