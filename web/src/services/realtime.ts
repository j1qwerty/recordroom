/**
 * Realtime channel client for the .NET 10 API's SignalR hub.
 *
 * The API publishes a `notification` after any write that another screen might
 * be showing. This subscribes and turns those into query invalidations, so a
 * receipt issued on one desk moves the dashboard and movement log on another
 * without a refresh.
 *
 * Only loaded when `VITE_API_MODE=http`: in local mode there is no hub, and the
 * dependency must stay out of that bundle entirely.
 *
 * A dropped connection is not an error the user should see. Notifications only
 * trigger a refetch, so a missed one costs staleness until the next poll or
 * navigation, and reconnection is automatic.
 */

import type { HubConnection } from '@microsoft/signalr';

export type Channel =
  | 'files'
  | 'locations'
  | 'issues'
  | 'movements'
  | 'digitization'
  | 'audit'
  | 'dashboard'
  | 'uploads';

export interface Notification {
  channel: string;
  action: string;
  entityId: string | null;
  summary: string;
  actor: string;
  at: string;
}

type Listener = (notification: Notification) => void;

const ALL: Channel[] = [
  'dashboard',
  'files',
  'issues',
  'movements',
  'locations',
  'digitization',
  'uploads',
  'audit',
];

class RealtimeClient {
  private connection: HubConnection | null = null;
  private starting: Promise<void> | null = null;
  private readonly listeners = new Set<Listener>();
  /** What is currently subscribed, so a re-subscribe is idempotent. */
  private joined = new Set<Channel>();

  get connected(): boolean {
    return this.connection?.state === 'Connected';
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Joins the channels a view depends on.
   *
   * The hub always joins `dashboard` on connect, so the stat cards stay live
   * wherever the user is.
   */
  async join(channels: Channel[]): Promise<void> {
    if (!isHttpMode()) return;
    await this.ensure();

    const wanted = channels.filter((channel) => !this.joined.has(channel));
    if (wanted.length === 0) return;

    try {
      await this.connection?.invoke('Subscribe', wanted);
      for (const channel of wanted) this.joined.add(channel);
    } catch {
      // A failed subscribe is recoverable: the next attempt re-runs on reload.
    }
  }

  async leave(channels: Channel[]): Promise<void> {
    if (!this.connection || channels.length === 0) return;
    const leaving = channels.filter((channel) => this.joined.delete(channel));
    if (leaving.length === 0) return;
    try {
      await this.connection.invoke('Unsubscribe', leaving);
    } catch {
      /* the group expires with the connection anyway */
    }
  }

  private async ensure(): Promise<void> {
    if (this.connection) return;
    // Concurrent callers must share one connection attempt.
    if (this.starting) return this.starting;

    this.starting = (async () => {
      const { HubConnectionBuilder, LogLevel } = await import('@microsoft/signalr');

      const connection = new HubConnectionBuilder()
        .withUrl(`${apiOrigin()}/hubs/recordroom`, {
          // The SignalR websocket handshake cannot set headers, so the token is
          // passed in the query string the same way the JS client requires.
          accessTokenFactory: () => currentToken() ?? '',
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();

      connection.on('notification', (payload: Notification) => {
        for (const listener of this.listeners) listener(payload);
      });

      connection.onreconnecting(() => {
        // Expected during a network blip; automatic reconnect handles it.
      });

      connection.onreconnected(() => {
        // The server forgets group membership on a new connection, so re-join.
        const channels = [...this.joined];
        this.joined.clear();
        void this.join(channels.length > 0 ? channels : ALL);
      });

      try {
        await connection.start();
        this.connection = connection;
        await this.join([...ALL]);
      } catch {
        // No hub reachable: the app still works, it just stops updating itself.
        this.starting = null;
      }
    })();

    return this.starting;
  }

  /** Test seam: drops the connection so a suite can start from a clean slate. */
  async reset(): Promise<void> {
    try {
      await this.connection?.stop();
    } catch {
      /* already gone */
    }
    this.connection = null;
    this.starting = null;
    this.joined.clear();
    this.listeners.clear();
  }
}

function isHttpMode(): boolean {
  return import.meta.env.VITE_API_MODE === 'http';
}

function apiOrigin(): string {
  return (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5199').replace(/\/+$/, '');
}

/**
 * The bearer token, read lazily from storage rather than imported, so this
 * module never captures a stale token at import time.
 */
function currentToken(): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem('rr-token');
  } catch {
    return null;
  }
}

export const realtime = new RealtimeClient();
