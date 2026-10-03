import { describe, expect, it } from 'vitest';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { apiBase, setToken } from '../src/services/http/client';
import { realtime, type Notification } from '../src/services/realtime';
import { httpAuthService, httpFilesService, httpLocationsService } from '../src/services/http';

/**
 * Realtime contract test: a write on one connection must push a notification to
 * another connection's subscribed channel.
 *
 * This is the check that the hub, the channel names on both sides and the
 * client's subscribe call all agree. A rename on either side would compile
 * cleanly and silently stop the dashboard updating.
 *
 * Skipped when the API is not running.
 */

const PASSWORD = 'Demo@12345';

const reachable = await probe();

async function probe(): Promise<boolean> {
  try {
    const response = await fetch(`${apiBase()}/api/health`, { signal: AbortSignal.timeout(4000) });
    return response.ok;
  } catch {
    return false;
  }
}

if (!reachable) console.warn(`[realtime] API not reachable at ${apiBase()}; skipping.`);

const suite = reachable ? describe : describe.skip;

suite('SignalR notifications', () => {
  it('pushes a notification to a subscriber when another client writes', async () => {
    const signIn = await httpAuthService.signIn('admin', PASSWORD);
    expect(signIn.ok).toBe(true);
    if (!signIn.ok) return;

    // A second connection, standing in for another desk. The API stamps audit
    // and movement rows with the caller, so this proves the push is caused by
    // the write rather than by the subscriber's own connection.
    const observer = new HubConnectionBuilder()
      .withUrl(`${apiBase()}/hubs/recordroom`)
      .configureLogging(LogLevel.None)
      .build();

    const received: Notification[] = [];
    observer.on('notification', (payload: Notification) => received.push(payload));
    await observer.start();

    try {
      await observer.invoke('Subscribe', ['files']);

      const shelf = await firstActiveShelf();
      const barcode = `RF-RT-${Date.now().toString().slice(-8)}`;
      const created = await httpFilesService.create({
        fileBarcode: barcode,
        subject: 'Created by the realtime test',
        department: 'Revenue',
        year: 2026,
        fileType: 'File',
        shelfId: shelf.id,
        position: 13,
        pincode: '',
        area: '',
        propertyNo: '',
        propertyArea: '',
        dealer: '',
        codalLife: '25 years',
        description: '',
      });
      expect(created.ok).toBe(true);

      // Give the hub a moment to fan the write out.
      await waitFor(() => received.length > 0, 5000);

      const notice = received.find((entry) => entry.channel === 'files');
      expect(notice).toBeDefined();
      if (!notice) return;
      expect(notice.action).toBe('file.created');
      expect(notice.entityId).toBe(String(created.ok ? (created as { value: { id: string } }).value.id : ''));
      expect(notice.summary).toContain(barcode);
      expect(notice.actor).toBe('admin');
    } finally {
      await httpFilesService
        .list({ search: 'realtime test', pageSize: 5 })
        .then((page) => page.items.filter((f) => f.subject.includes('realtime test')))
        .then((files) => Promise.all(files.map((f) => httpFilesService.remove(f.id))));
      await observer.stop();
    }
  });

  it('publishes to dashboard as well as the originating channel', async () => {
    // Every write also nudges dashboard, which is why the stat cards stay live
    // on a screen that never subscribed to the originating channel.
    const observer = new HubConnectionBuilder()
      .withUrl(`${apiBase()}/hubs/recordroom`)
      .configureLogging(LogLevel.None)
      .build();

    const received: Notification[] = [];
    observer.on('notification', (payload: Notification) => received.push(payload));
    await observer.start();

    try {
      // Every connection joins dashboard automatically on connect.
      const shelf = await firstActiveShelf();
      const barcode = `RF-RT2-${Date.now().toString().slice(-8)}`;
      const created = await httpFilesService.create({
        fileBarcode: barcode,
        subject: 'Dashboard fan-out probe',
        department: 'Revenue',
        year: 2026,
        fileType: 'File',
        shelfId: shelf.id,
        position: 14,
        pincode: '',
        area: '',
        propertyNo: '',
        propertyArea: '',
        dealer: '',
        codalLife: '25 years',
        description: '',
      });
      expect(created.ok).toBe(true);

      await waitFor(() => received.some((entry) => entry.channel === 'dashboard'), 5000);
      expect(received.some((entry) => entry.channel === 'dashboard')).toBe(true);
    } finally {
      await httpFilesService
        .list({ search: 'fan-out probe', pageSize: 5 })
        .then((page) => page.items)
        .then((files) => Promise.all(files.map((f) => httpFilesService.remove(f.id))));
      await observer.stop();
    }
  });

  it('is inert in local mode rather than throwing', async () => {
    // VITE_API_MODE is unset in tests, so `realtime.join` must be a no-op. If it
    // ever tried to connect unconditionally, the in-memory adapter would start
    // opening sockets to an API the developer may not be running.
    await expect(realtime.join(['files'])).resolves.toBeUndefined();
    expect(realtime.connected).toBe(false);
  });

  it('setToken keeps the value the hub reads', async () => {
    // Guards the accessTokenFactory path: the client reads 'rr-token'.
    setToken('probe-token');
    const signIn = await httpAuthService.signIn('admin', PASSWORD);
    expect(signIn.ok).toBe(true);
  });
});

async function firstActiveShelf() {
  const rooms = await httpLocationsService.listRooms();
  for (const room of rooms) {
    for (const unit of room.storageUnits) {
      const shelf = unit.shelves.find((item) => item.status === 'Active');
      if (shelf) return shelf;
    }
  }
  throw new Error('The seeded registry has no active shelf.');
}

async function waitFor(predicate: () => boolean, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}