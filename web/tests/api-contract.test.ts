import { describe, expect, it } from 'vitest';
import {
  httpAuthService,
  httpBarcodesService,
  httpDashboardService,
  httpDigitizationService,
  httpEmployeesService,
  httpFilesService,
  httpIssuesService,
  httpLocationsService,
  httpReportsService,
} from '../src/services/http';
import { apiBase, getToken } from '../src/services/http/client';

/**
 * Contract test between the frontend adapter and the running API.
 *
 * This is the check typecheck cannot do. The DTOs compile against the frontend
 * types, but only a real response proves the field names, the status spellings
 * and the id handling actually line up. A mismatch here is exactly the bug that
 * would otherwise surface as an empty page in the browser.
 *
 * Skipped when the API is not running, so `pnpm test` stays useful offline:
 *
 *   cd dotnet-api/src/RecordRoom.Api
 *   dotnet run --urls http://localhost:5199
 *   cd ../../record-room-frontend && pnpm test
 */

const PASSWORD = 'Demo@12345';

// Probed at module scope, not in beforeAll: whether to register the suites is
// decided during collection, which happens before any hook runs.
const reachable = await probe();

async function probe(): Promise<boolean> {
  try {
    const response = await fetch(`${apiBase()}/api/health`, { signal: AbortSignal.timeout(4000) });
    return response.ok;
  } catch {
    return false;
  }
}

if (!reachable) console.warn(`[contract] API not reachable at ${apiBase()}; skipping.`);

const describeIfLive = reachable ? describe : describe.skip;

describeIfLive('auth against the API', () => {
  it('signs in and returns a usable user', async () => {
    const result = await httpAuthService.signIn('operator', PASSWORD);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.role).toBe('Operator');
    expect(result.value.userName).toBe('operator');
    // Leave the suite signed in as admin for the tests that follow.
    await httpAuthService.signIn('admin', PASSWORD);
  });

  it('refuses a wrong password with a field-level message', async () => {
    const result = await httpAuthService.signIn('admin', 'not-the-password');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe('password');
  });

  it('never echoes the OTP back over HTTP', async () => {
    const result = await httpAuthService.requestOtp('operator');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // The API delivers the code out of band; an empty value is correct.
    expect(result.value.otp).toBe('');
    expect(result.value.id).not.toBe('');
  });
});

describeIfLive('locations against the API', () => {
  it('returns a walkable room tree', async () => {
    const rooms = await httpLocationsService.listRooms();
    expect(rooms.length).toBeGreaterThan(0);

    const room = rooms[0];
    expect(room.code).toBeTruthy();
    expect(room.status).toMatch(/Operational|Restricted|Maintenance/);

    const section = room.sections[0];
    expect(section.roomId).toBe(room.id);

    const unit = room.storageUnits.find((item) => item.sectionId === section.id);
    expect(unit).toBeDefined();
    expect(unit!.shelves.length).toBeGreaterThan(0);
    // The tree must be navigable from a shelf back up to its almirah.
    expect(unit!.shelves[0].almirahId).toBe(unit!.id);
  });

  it('resolves a shelf by barcode and by id', async () => {
    const rooms = await httpLocationsService.listRooms();
    const shelf = rooms[0].storageUnits[0].shelves[0];

    expect((await httpLocationsService.findShelf(shelf.id))?.code).toBe(shelf.code);
    expect((await httpLocationsService.findShelfByBarcode(shelf.barcode))?.id).toBe(shelf.id);
  });

  it('returns area master rows with a status word', async () => {
    const areas = await httpLocationsService.areas();
    expect(areas.length).toBeGreaterThan(0);
    expect(areas[0].status).toMatch(/Active|Inactive/);
  });
});

describeIfLive('files against the API', () => {
  it('pages server-side and reports the true collection size', async () => {
    const page = await httpFilesService.list({ pageSize: 5 });

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.length).toBeLessThanOrEqual(5);
    expect(page.pageSize).toBe(5);
    // The registry is far larger than one page; the label must stay honest.
    expect(page.collectionTotal).toBeGreaterThan(page.total);
  });

  it('filters and sorts on the server', async () => {
    const all = await httpFilesService.list({ pageSize: 50 });
    const asc = await httpFilesService.list({ sort: 'fileNumber', direction: 'asc', pageSize: 50 });
    const desc = await httpFilesService.list({ sort: 'fileNumber', direction: 'desc', pageSize: 50 });

    expect(asc.items[0].fileNumber).toBe(desc.items[desc.items.length - 1].fileNumber);

    const issued = await httpFilesService.list({ status: 'Issued', pageSize: 50 });
    expect(issued.items.every((file) => file.status === 'Issued')).toBe(true);

    const search = await httpFilesService.list({ search: 'land', pageSize: 10 });
    expect(search.total).toBeGreaterThanOrEqual(0);
    expect(all.total).toBeGreaterThan(0);
  });

  it('maps a file with every field the UI renders', async () => {
    const page = await httpFilesService.list({ pageSize: 1 });
    const file = page.items[0];

    expect(file.id).toMatch(/^\d+$/);
    expect(file.fileBarcode).toMatch(/^RF-/);
    expect(file.rfId).toBe(file.fileBarcode);
    expect(file.status).toMatch(/Available|Issued|Under Digitization|Missing|Archived/);
    expect(file.location).toBeTruthy();
    expect(file.lastMovement).toBeTruthy();

    expect((await httpFilesService.byBarcode(file.fileBarcode))?.id).toBe(file.id);
  });

  it('rejects a duplicate barcode with the offending field', async () => {
    const existing = (await httpFilesService.list({ pageSize: 1 })).items[0];
    const shelf = await firstActiveShelf();

    const result = await httpFilesService.create({
      fileBarcode: existing.fileBarcode,
      subject: 'Duplicate attempt',
      department: 'Revenue',
      year: 2026,
      fileType: 'File',
      shelfId: shelf.id,
      position: 10,
      pincode: '',
      area: '',
      propertyNo: '',
      propertyArea: '',
      dealer: '',
      codalLife: '25 years',
      description: '',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe('fileBarcode');
  });

  it('creates, relocates and then removes a file', async () => {
    const shelf = await firstActiveShelf();
    const barcode = `RF-CT-${Date.now().toString().slice(-10)}`;

    const created = await httpFilesService.create({
      fileBarcode: barcode,
      subject: 'Created by the contract test',
      department: 'Revenue',
      year: 2026,
      fileType: 'File',
      shelfId: shelf.id,
      position: 11,
      pincode: '',
      area: '',
      propertyNo: 'PROP-CT',
      propertyArea: '1 hectare',
      dealer: 'Contract test',
      codalLife: '25 years',
      description: 'Created by the contract test.',
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.fileBarcode).toBe(barcode);
    expect(created.value.status).toBe('Available');
    expect(created.value.location).toContain(shelf.code);

    const moved = await httpFilesService.relocate(created.value.id, shelf.id, 29, 'contract test');
    expect(moved.ok).toBe(true);
    if (moved.ok) expect(moved.value.position).toBe(29);

    const removed = await httpFilesService.remove(created.value.id);
    expect(removed.ok).toBe(true);
    expect(await httpFilesService.byBarcode(barcode)).toBeNull();
  });
});

describeIfLive('issues against the API', () => {
  it('issues several files on one receipt and settles it in parts', async () => {
    const available = await httpFilesService.list({ status: 'Available', pageSize: 10 });
    const targets = available.items.slice(0, 2);
    expect(targets.length).toBe(2);

    const issued = await httpIssuesService.issueFiles({
      borrowerType: 'Employee',
      borrowerEmployeeCode: 'EMP0001',
      borrowerName: 'Ramesh Kumar',
      department: 'Establishment',
      purpose: 'contract test',
      fileIds: targets.map((file) => file.id),
      dueAt: '2030-01-01T00:00:00',
      remark: 'contract test',
    });

    expect(issued.ok).toBe(true);
    if (!issued.ok) return;
    expect(issued.value.lines).toHaveLength(2);
    expect(issued.value.status).toBe('Issued');
    // The status word must match the frontend union exactly, not the enum name.
    expect(issued.value.status).toBe('Issued');

    for (const file of targets) {
      expect((await httpFilesService.get(file.id))?.status).toBe('Issued');
    }

    const partial = await httpIssuesService.returnFiles(issued.value.id, [targets[0].id], 'Good');
    expect(partial.ok).toBe(true);
    if (!partial.ok) return;
    expect(partial.value.status).toBe('Partially returned');
    expect((await httpFilesService.get(targets[0].id))?.status).toBe('Available');
    expect((await httpFilesService.get(targets[1].id))?.status).toBe('Issued');

    const rest = await httpIssuesService.returnFiles(issued.value.id, [targets[1].id], 'Good');
    expect(rest.ok).toBe(true);
    if (!rest.ok) return;
    expect(rest.value.status).toBe('Returned');
    expect(rest.value.returnedAt).toBeTruthy();
  });

  it('offers a well-formed next receipt number', async () => {
    expect(await httpIssuesService.nextReceiptNumber()).toMatch(/^ISS-\d{4}-\d{4}$/);
  });
});

describeIfLive('dashboard, reports and barcodes against the API', () => {
  it('returns bounded dashboard figures', async () => {
    const stats = await httpDashboardService.stats();
    expect(stats.totalRecords).toBeGreaterThan(0);
    expect(stats.mappedPercent).toBeGreaterThanOrEqual(0);
    expect(stats.mappedPercent).toBeLessThanOrEqual(100);
  });

  it('builds every declared report', async () => {
    const definitions = await httpReportsService.definitions();
    expect(definitions.length).toBeGreaterThan(0);

    for (const definition of definitions) {
      const result = await httpReportsService.build(definition.key);
      expect(result.columns.length).toBeGreaterThan(0);
      expect(Array.isArray(result.rows)).toBe(true);
    }
  });

  it('builds a file payload matching the shared RR|SUBJECT|VALUE grammar', async () => {
    const file = (await httpFilesService.list({ pageSize: 1 })).items[0];
    const payload = await httpBarcodesService.payloadFor('File', file.id);

    expect(payload).not.toBeNull();
    if (!payload) return;
    expect(payload.value).toBe(`RR|FILE|${file.fileBarcode}`);
    expect(payload.label).toBe(file.fileNumber);
    expect(payload.symbology).toBe('Code128');

    const scan = await httpBarcodesService.validate(payload.value);
    expect(scan.ok).toBe(true);
    expect(scan.payload?.subject).toBe('File');

    const bad = await httpBarcodesService.validate('not-a-payload');
    expect(bad.ok).toBe(false);
    expect(bad.message).toContain('Unrecognised');
  });

  it('reports a pending digitization review count', async () => {
    expect(await httpDigitizationService.pendingReviewCount()).toBeGreaterThanOrEqual(0);
  });

  it('lists employees with a valid role and status word', async () => {
    const page = await httpEmployeesService.list({ pageSize: 5 });
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items[0].role).toMatch(/Admin|Supervisor|Operator|Employee/);
    expect(page.items[0].status).toMatch(/Active|Inactive|Retired/);
  });
});

describeIfLive('role enforcement against the API', () => {
  it('refuses the audit trail and report export to an employee', async () => {
    await httpAuthService.signIn('employee', PASSWORD);

    // reports.view is granted to every role, including Employee, so this must
    // succeed. The audit trail and the export are the ones they must not reach.
    expect((await httpReportsService.definitions()).length).toBeGreaterThan(0);
    expect((await httpFilesService.list({ pageSize: 1 })).items.length).toBeGreaterThan(0);

    // Asserted against the endpoint rather than through an adapter: reads throw,
    // and what matters is that the server refuses, not that the client hides a
    // control.
    const headers = { Authorization: `Bearer ${getToken()}` };
    expect((await fetch(`${apiBase()}/api/audit`, { headers })).status).toBe(403);
    expect((await fetch(`${apiBase()}/api/reports/file-registry/export`, { headers })).status).toBe(403);

    await httpAuthService.signIn('admin', PASSWORD);
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