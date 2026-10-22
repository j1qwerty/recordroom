import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequireAuth } from '../src/layouts/RouteGuards';
import { session } from '../src/services/impl/session';
import type { AppUser } from '../src/types';

/**
 * The sign-out redirect.
 *
 * `RequireAuth` is a render-time check, so it only fires when something tells
 * React the session changed. It used to subscribe only to the store, which a
 * sign-out over HTTP never writes to, so the guard kept rendering the app with a
 * dead token. These tests assert the subscription and the guard's decision, both
 * of which are observable without a browser.
 */

const user: AppUser = {
  id: 'u1',
  userName: 'admin',
  displayName: 'Farida Begum',
  role: 'Admin',
  active: true,
  lastLoginAt: '2026-01-01T00:00:00Z',
};

/** Renders the guard around a protected route, exactly as App.tsx wraps it. */
function renderGuardedApp() {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/files'] },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: '/login',
          element: createElement('p', null, 'SIGN-IN SCREEN'),
        }),
        createElement(Route, {
          path: '/files',
          element: createElement(
            RequireAuth,
            null,
            createElement('p', null, 'PROTECTED APP'),
          ),
        }),
      ),
    ),
  );
}

describe('session observability', () => {
  it('announces sign-in and sign-out to subscribers', () => {
    const seen: Array<AppUser | null> = [];
    const stop = session.subscribe(() => seen.push(session.get()));

    session.set(user);
    session.set(null);
    stop();

    // A change after unsubscribe must not reach a listener that has left.
    session.set(user);
    session.set(null);

    expect(seen).toEqual([user, null]);
  });

  it('stops notifying after unsubscribe', () => {
    let calls = 0;
    const stop = session.subscribe(() => {
      calls += 1;
    });

    session.set(user);
    expect(calls).toBe(1);

    stop();
    session.set(null);
    expect(calls).toBe(1);
  });

  it('reports the signed-out state through get', () => {
    session.set(user);
    expect(session.get()).toEqual(user);
    expect(session.isSignedIn()).toBe(true);

    session.set(null);
    expect(session.get()).toBeNull();
    expect(session.isSignedIn()).toBe(false);
  });
});

describe('RequireAuth', () => {
  it('renders no protected content when signed out', () => {
    session.set(null);

    // Static rendering is a single pass and <Navigate> performs its redirect in
    // an effect, so the redirect itself is not observable here. The decision is:
    // a signed-out visitor gets none of the protected tree.
    expect(renderGuardedApp()).not.toContain('PROTECTED APP');
  });

  it('renders the protected app when signed in', () => {
    session.set(user);

    const markup = renderGuardedApp();
    expect(markup).toContain('PROTECTED APP');

    session.set(null);
  });
});