import { describe, expect, it, beforeEach } from 'vitest';
import { session } from '../src/services/impl/session';
import type { AppUser } from '../src/types';

/**
 * `session.get` is the `getSnapshot` handed to `useSyncExternalStore` by the
 * route guard and by `useSession`. React requires that snapshot to be
 * referentially stable: if it returns a new object on every call, React treats
 * the store as changing on every render and re-renders until it throws
 * "Maximum update depth exceeded" (React error #185).
 *
 * The guard hides this: with an in-memory `current`, `get` is trivially stable.
 * The failure only appears on a real page load, where the session is restored
 * from localStorage and every call used to re-parse it into a fresh object.
 * So these tests deliberately exercise the storage path.
 */

const user: AppUser = {
  id: 'u1',
  userName: 'admin',
  displayName: 'Farida Begum',
  role: 'Admin',
  active: true,
  lastLoginAt: '2026-01-01T00:00:00Z',
};

/** Minimal localStorage so the storage path is exercised in the node env. */
function withStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => void map.set(key, value),
      removeItem: (key: string) => void map.delete(key),
    },
  });
  return map;
}

describe('session snapshot stability', () => {
  beforeEach(() => {
    session.set(null);
    withStorage();
  });

  it('returns the same object identity across repeated reads', () => {
    withStorage({ 'rr-session': JSON.stringify(user) });

    const first = session.get();
    const second = session.get();
    const third = session.get();

    expect(first).not.toBeNull();
    // The assertion that matters: identical references, not merely deep-equal.
    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  it('stays stable while the stored session is unchanged', () => {
    const map = withStorage({ 'rr-session': JSON.stringify(user) });

    const before = session.get();
    // Same value rewritten by another writer, e.g. another tab.
    map.set('rr-session', JSON.stringify(user));
    const after = session.get();

    expect(after).toBe(before);
  });

  it('returns a new identity once the stored session actually changes', () => {
    const map = withStorage({ 'rr-session': JSON.stringify(user) });
    const first = session.get();

    map.set('rr-session', JSON.stringify({ ...user, role: 'Operator' }));
    const second = session.get();

    expect(second).not.toBe(first);
    expect(second?.role).toBe('Operator');
  });

  it('reports signed out when storage holds no session', () => {
    expect(session.get()).toBeNull();
    expect(session.isSignedIn()).toBe(false);
  });

  it('ignores malformed stored JSON instead of throwing', () => {
    withStorage({ 'rr-session': '{not json' });
    expect(session.get()).toBeNull();
  });

  it('rejects a stored object missing the identity fields', () => {
    withStorage({ 'rr-session': JSON.stringify({ nope: true }) });
    expect(session.get()).toBeNull();
  });

  it('prefers the in-memory user over storage', () => {
    withStorage({ 'rr-session': JSON.stringify({ ...user, role: 'Employee' }) });
    session.set(user);

    expect(session.get()?.role).toBe('Admin');
    expect(session.isSignedIn()).toBe(true);
  });
});
