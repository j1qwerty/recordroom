/**
 * React bindings for the service layer.
 *
 * `useQuery` is how pages read data. The service contract is async because the
 * API owns filtering, sorting and paging, so a page cannot derive its rows from
 * a synchronous snapshot any more; it asks and renders what comes back.
 *
 * `useDb` remains for the in-memory adapter's cross-references and counters. It
 * is empty under the HTTP adapter, so a page that needs real numbers must read
 * them from a service instead.
 */

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { service, store, type RecordRoomService } from '../services';
import { session } from '../services/impl/session';
import { realtime, type Channel } from '../services/realtime';
import type { DbShape } from '../services/store';
import type { AppUser, Role } from '../types';
import type { Permission } from '../services/permissions';
import { can } from '../services/permissions';

export interface QueryState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Runs an async service call and tracks its state.
 *
 * `deps` behaves like a `useEffect` dependency list: change one and the call
 * re-runs. `initial` is what renders before the first response arrives, so a
 * page never has to special-case `undefined`.
 *
 * Loading is derived from a request key rather than stored in state. Storing it
 * would mean calling `setLoading(true)` synchronously inside the effect body,
 * which cascades an extra render on every query; deriving it means the effect
 * only ever writes state from an async callback.
 *
 * Two guards matter here. A request whose deps changed before it resolved is
 * discarded, because a slow response for an old filter would otherwise overwrite
 * the rows the user is now looking at. And `reload` exists for refetching after
 * a write.
 */
export function useQuery<T>(
  run: () => Promise<T>,
  deps: readonly unknown[],
  initial: T,
  channels: Channel[] = [],
): QueryState<T> {
  const [nonce, setNonce] = useState(0);

  // Identifies this request. Changing deps or bumping nonce starts a new one,
  // which is what makes `loading` true without any setState in the effect body.
  const key = useMemo(() => `${JSON.stringify(deps)}#${nonce}`, [deps, nonce]);

  const [state, setState] = useState<{ key: string; data: T; error: string | null }>({
    key,
    data: initial,
    error: null,
  });

  // Another desk writing to this area invalidates what is on screen. Joining
  // the channel turns the API's push into the refetch a user expects without
  // polling.
  //
  // Keyed on the joined names, not the array: call sites pass a literal, so the
  // array identity changes every render and a `[channels]` dependency would
  // resubscribe in a loop.
  const channelKey = channels.join(',');

  useEffect(() => {
    if (channelKey.length === 0) return;
    const list = channelKey.split(',') as Channel[];
    void realtime.join(list);
    return realtime.subscribe(() => setNonce((n) => n + 1));
  }, [channelKey]);

  useEffect(() => {
    let live = true;

    run().then(
      (value) => {
        if (live) setState({ key, data: value, error: null });
      },
      (cause: unknown) => {
        if (!live) return;
        const error = cause instanceof Error ? cause.message : String(cause);
        // Keep the previous rows on failure: an empty table plus an error reads
        // as "there is nothing here", which is a different claim.
        setState((current) => ({ ...current, key, error }));
      },
    );

    return () => {
      live = false;
    };
    // `run` is intentionally omitted: it closes over `deps`, which is what
    // decides when to refetch. Listing it would refetch on every render, since
    // call sites pass an inline arrow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    data: state.data,
    loading: state.key !== key,
    error: state.error,
    reload,
  };
}

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
    void service.auth.signOut();
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
