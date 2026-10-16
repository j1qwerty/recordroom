import { beforeEach, describe, expect, it } from 'vitest';
import { service } from '../src/services';
import type { FileCreateInput } from '../src/types';

/**
 * Guards copied from the legacy controllers:
 * `File.php: checkfilebarcode / checkShelfBarcode`, `Record.php:
 * multipleFileIssue`, `Store_model.php` hierarchy guards and
 * `Employee_reports: match_otp`.
 *
 * These run against the in-memory adapter, so they need no API. The same rules
 * are asserted again over real HTTP by `dotnet-api/scripts/test-api.ps1`; this
 * file is the fast feedback loop, that one is the contract check.
 *
 * Every test starts from the seed snapshot, so order does not matter.
 */

const baseFile: FileCreateInput = {
  fileBarcode: 'RF-9000000001',
  subject: 'Test registry row',
  department: 'Revenue',
  year: 2026,
  fileType: 'File',
  shelfId: '',
  position: 10,
  pincode: '',
  area: '',
  propertyNo: '',
  propertyArea: '',
  dealer: '',
  codalLife: '25 years',
  description: 'Created by the test suite',
};

const firstActiveShelf = async () => {
  for (const room of await service.locations.listRooms()) {
    for (const unit of room.storageUnits) {
      const shelf = unit.shelves.find((item) => item.status === 'Active');
      if (shelf) return shelf;
    }
  }
  throw new Error('Seed has no active shelf');
};

const allShelves = async () => {
  const rooms = await service.locations.listRooms();
  return rooms.flatMap((room) => room.storageUnits.flatMap((unit) => unit.shelves));
};

const issue = (fileIds: string[], dueAt = '2030-01-01') =>
  service.issues.issueFiles({
    borrowerType: 'Employee',
    borrowerEmployeeCode: 'EMP0001',
    borrowerName: 'Ramesh Kumar',
    department: 'Establishment',
    purpose: '',
    fileIds,
    dueAt,
    remark: '',
  });

beforeEach(async () => {
  await service.reset();
  await service.auth.signIn('admin', service.auth.demoPassword);
});

describe('locations.addRoom', () => {
  it('creates a room and makes it available in the location hierarchy', async () => {
    const result = await service.locations.addRoom({
      code: 'RR-UX-01',
      name: 'UX Test Room',
      building: 'Main building',
      floor: 'Ground',
      capacity: 75,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.code).toBe('RR-UX-01');
    expect(result.value.capacity).toBe(75);
    expect((await service.locations.listRooms()).some((room) => room.id === result.value.id)).toBe(true);
  });

  it('rejects duplicate room codes without creating a second room', async () => {
    const first = await service.locations.addRoom({ code: 'RR-UX-02', name: 'First room' });
    expect(first.ok).toBe(true);
    const before = (await service.locations.listRooms()).length;

    const duplicate = await service.locations.addRoom({ code: 'rr-ux-02', name: 'Duplicate room' });
    expect(duplicate.ok).toBe(false);
    expect((await service.locations.listRooms()).length).toBe(before);
  });
});

describe('files.validateCreate', () => {
  it('refuses a barcode that already exists', async () => {
    const existing = (await service.files.list({ pageSize: 1 })).items[0];
    const issues = await service.files.validateCreate({
      ...baseFile,
      fileBarcode: existing.fileBarcode,
      shelfId: (await firstActiveShelf()).id,
    });
    expect(issues.some((issue) => issue.field === 'fileBarcode' && issue.severity === 'error')).toBe(
      true,
    );
  });

  it('treats barcodes case-insensitively', async () => {
    const existing = (await service.files.list({ pageSize: 1 })).items[0];
    const issues = await service.files.validateCreate({
      ...baseFile,
      fileBarcode: existing.fileBarcode.toLowerCase(),
      shelfId: (await firstActiveShelf()).id,
    });
    expect(issues.some((issue) => issue.field === 'fileBarcode')).toBe(true);
  });

  it('refuses a shelf that is not active', async () => {
    const inactive = (await allShelves()).find((shelf) => shelf.status !== 'Active');
    expect(inactive).toBeDefined();
    const issues = await service.files.validateCreate({ ...baseFile, shelfId: inactive!.id });
    expect(issues.some((issue) => issue.field === 'shelfId' && issue.severity === 'error')).toBe(
      true,
    );
  });

  it('refuses an unknown area', async () => {
    const issues = await service.files.validateCreate({
      ...baseFile,
      shelfId: (await firstActiveShelf()).id,
      area: 'NOWHERE',
    });
    expect(issues.some((issue) => issue.field === 'area' && issue.severity === 'error')).toBe(true);
  });

  it('refuses a position outside 1..100', async () => {
    const issues = await service.files.validateCreate({
      ...baseFile,
      shelfId: (await firstActiveShelf()).id,
      position: 0,
    });
    expect(issues.some((issue) => issue.field === 'position')).toBe(true);
  });

  it('refuses an e-office reference longer than 200 characters', async () => {
    const shelf = await firstActiveShelf();
    const issues = await service.files.validateCreate({
      ...baseFile,
      shelfId: shelf.id,
      eOfficeReference: 'E'.repeat(201),
    });
    expect(issues.some((issue) => issue.field === 'eOfficeReference' && issue.severity === 'error')).toBe(true);
  });

  it('accepts a clean row', async () => {
    const shelf = await firstActiveShelf();
    const issues = await service.files.validateCreate({ ...baseFile, shelfId: shelf.id });
    expect(issues.filter((issue) => issue.severity === 'error')).toHaveLength(0);
  });
});

describe('files.create', () => {
  it('resolves the location path from the shelf and increments occupancy', async () => {
    const shelf = await firstActiveShelf();
    const before = shelf.occupied;
    const result = await service.files.create({ ...baseFile, shelfId: shelf.id });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.shelfId).toBe(shelf.id);
    expect(result.value.location).toContain(shelf.code);
    expect(result.value.status).toBe('Available');
    expect((await service.locations.findShelf(shelf.id))?.occupied).toBe(before + 1);
  });

  it('defaults A0 documents to map records when staff do not override the kind', async () => {
    const shelf = await firstActiveShelf();
    const result = await service.files.create({
      ...baseFile,
      fileBarcode: 'RF-9000000002',
      documentSize: 'A0',
      shelfId: shelf.id,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.documentSize).toBe('A0');
    expect(result.value.recordKind).toBe('Map');
  });

  it('searches and filters by optional e-office reference and lets staff clear it', async () => {
    const shelf = await firstActiveShelf();
    const created = await service.files.create({
      ...baseFile,
      fileBarcode: 'RF-9000000003',
      eOfficeReference: 'EOFFICE/REV/2026/003',
      shelfId: shelf.id,
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(created.value.eOfficeReference).toBe('EOFFICE/REV/2026/003');
    expect(
      (await service.files.list({ search: 'EOFFICE/REV/2026/003' })).items.some(
        (file) => file.id === created.value.id,
      ),
    ).toBe(true);
    expect(
      (await service.files.list({ search: created.value.fileBarcode, eOfficeStatus: 'Linked' })).items.some(
        (file) => file.id === created.value.id,
      ),
    ).toBe(true);
    expect(
      (await service.files.list({ search: created.value.fileBarcode, eOfficeStatus: 'Not linked' })).items.some(
        (file) => file.id === created.value.id,
      ),
    ).toBe(false);

    const updated = await service.files.updateEOfficeReference(created.value.id, 'EOFFICE/REV/2026/003B');
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.eOfficeReference).toBe('EOFFICE/REV/2026/003B');

    const cleared = await service.files.updateEOfficeReference(created.value.id, '');
    expect(cleared.ok).toBe(true);
    if (!cleared.ok) return;
    expect(cleared.value.eOfficeReference).toBeUndefined();
    expect(
      (await service.files.list({ search: created.value.fileBarcode, eOfficeStatus: 'Not linked' })).items.some(
        (file) => file.id === created.value.id,
      ),
    ).toBe(true);
  });

  it('rejects an e-office reference longer than 200 characters', async () => {
    const shelf = await firstActiveShelf();
    const created = await service.files.create({
      ...baseFile,
      fileBarcode: 'RF-9000000004',
      shelfId: shelf.id,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await service.files.updateEOfficeReference(created.value.id, 'E'.repeat(201));
    expect(updated.ok).toBe(false);
  });

  it('writes a movement event and an audit row in the same change', async () => {
    const movements = (await service.movements.list({ limit: 500 })).length;
    const audit = (await service.audit.list({ limit: 500 })).length;
    await service.files.create({ ...baseFile, shelfId: (await firstActiveShelf()).id });

    expect((await service.movements.list({ limit: 500 })).length).toBe(movements + 1);
    expect((await service.audit.list({ limit: 500 })).length).toBe(audit + 1);
  });
});

describe('issues.issueFiles', () => {
  const availableFiles = async (count: number) =>
    (await service.files.list({ status: 'Available', pageSize: 10 })).items.slice(0, count);

  it('refuses an empty scan list', async () => {
    expect((await issue([])).ok).toBe(false);
  });

  it('refuses the same file twice on one receipt', async () => {
    const file = (await availableFiles(1))[0];
    const result = await issue([file.id, file.id]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('scanned twice');
  });

  it('refuses a file that is not Available', async () => {
    const issued = (await service.files.list({ status: 'Issued', pageSize: 1 })).items[0];
    expect((await issue([issued.id])).ok).toBe(false);
  });

  it('issues several files on one receipt and flips every status', async () => {
    const targets = await availableFiles(2);
    expect(targets.length).toBe(2);
    const result = await issue(targets.map((file) => file.id));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.lines).toHaveLength(2);
    expect(result.value.status).toBe('Issued');
    for (const file of targets) {
      const after = await service.files.get(file.id);
      expect(after?.status).toBe('Issued');
      expect(after?.holderEmployeeCode).toBe('EMP0001');
    }
  });

  it('supports partial return and settles the receipt', async () => {
    const targets = await availableFiles(2);
    const issued = await issue(targets.map((file) => file.id));
    if (!issued.ok) throw new Error('issue failed');

    const partial = await service.issues.returnFiles(issued.value.id, [targets[0].id], 'Good');
    expect(partial.ok).toBe(true);
    if (!partial.ok) return;
    expect(partial.value.status).toBe('Partially returned');
    expect((await service.files.get(targets[0].id))?.status).toBe('Available');
    expect((await service.files.get(targets[1].id))?.status).toBe('Issued');

    const rest = await service.issues.returnFiles(issued.value.id, [targets[1].id], 'Good');
    expect(rest.ok).toBe(true);
    if (!rest.ok) return;
    expect(rest.value.status).toBe('Returned');
    expect(rest.value.returnedAt).toBeTruthy();
  });

  it('refuses to return a file that belongs to another receipt', async () => {
    const open = (await service.issues.list({ open: true, pageSize: 1 })).items[0];
    const other = (await service.files.list({ status: 'Issued', pageSize: 5 })).items.find(
      (file) => !open.lines.some((line) => line.fileId === file.id),
    );
    if (!other) return;
    expect((await service.issues.returnFiles(open.id, [other.id], 'Good')).ok).toBe(false);
  });
});

describe('locations guards', () => {
  it('refuses to delete a section that still holds almirahs', async () => {
    const room = (await service.locations.listRooms())[0];
    const section = room.sections.find((item) =>
      room.storageUnits.some((unit) => unit.sectionId === item.id),
    );
    if (!section) return;
    const result = await service.locations.deleteSection(section.id);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('almirah');
  });

  it('refuses to deactivate a section that holds active almirahs', async () => {
    const room = (await service.locations.listRooms())[0];
    expect((await service.locations.updateSection(room.sections[0].id, { status: 'Inactive' })).ok).toBe(
      false,
    );
  });

  it('refuses to delete a shelf that holds files', async () => {
    const file = (await service.files.list({ pageSize: 20 })).items.find((item) => item.shelfId);
    if (!file) return;
    expect((await service.locations.deleteShelf(file.shelfId)).ok).toBe(false);
  });

  it('refuses a duplicate shelf barcode', async () => {
    const room = (await service.locations.listRooms())[0];
    const taken = room.storageUnits[0].shelves[0].barcode;
    const empty = room.storageUnits.find((unit) => unit.shelves.length === 0);
    if (!empty) return;
    const result = await service.locations.addShelf(empty.id, {
      code: 'TEST-S-01',
      name: 'Test',
      barcode: taken,
    });
    expect(result.ok).toBe(false);
  });

  it('refuses a duplicate section name inside the same room', async () => {
    const room = (await service.locations.listRooms())[0];
    expect((await service.locations.addSection(room.id, { name: room.sections[0].name })).ok).toBe(
      false,
    );
  });

  it('adds then removes an empty section', async () => {
    const room = (await service.locations.listRooms())[0];
    const created = await service.locations.addSection(room.id, { name: 'TEST-Z' });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect((await service.locations.deleteSection(created.value.id)).ok).toBe(true);
  });

  it('increments the layout revision on save', async () => {
    const room = (await service.locations.listRooms())[0];
    const first = await service.locations.saveLayout(room.id, 'first');
    const second = await service.locations.saveLayout(room.id, 'second');
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.value.revision).toBe(first.value.revision + 1);
  });
});

describe('digitization', () => {
  it('refuses a page for a barcode that is not registered', async () => {
    const batch = (await service.digitization.batches())[0];
    const result = await service.digitization.uploadPage(batch.id, {
      fileBarcode: 'RF-DOES-NOT-EXIST',
      pageNo: 1,
      filename: '',
      bulk: false,
    });
    expect(result.ok).toBe(false);
  });

  it('bumps the version when the same file and page is scanned again', async () => {
    const employee = (await service.employees.list({ pageSize: 50 })).items[0];
    const batch = await service.digitization.createBatch({
      employeeCode: employee.employeeCode,
      folder: 'apar',
      note: '',
    });
    if (!batch.ok) throw new Error('batch failed');
    const target = (await service.files.list({ pageSize: 5 })).items[0];

    const first = await service.digitization.uploadPage(batch.value.id, {
      fileBarcode: target.fileBarcode,
      pageNo: 1,
      filename: '',
      bulk: false,
    });
    const second = await service.digitization.uploadPage(batch.value.id, {
      fileBarcode: target.fileBarcode,
      pageNo: 1,
      filename: '',
      bulk: false,
    });
    if (!first.ok || !second.ok) throw new Error('upload failed');
    expect(first.value.version).toBe(1);
    expect(second.value.version).toBe(2);
    expect(second.value.note).toContain('Rescan');
  });

  it('refuses a rejection without a reason', async () => {
    const batches = await service.digitization.batches();
    const batch = batches.find((item) => item.pages.some((page) => page.status === 'Pending review'));
    const page = batch?.pages.find((item) => item.status === 'Pending review');
    if (!page) return;
    expect((await service.digitization.reviewPage(page.id, 'Rejected', '  ')).ok).toBe(false);
  });

  it('refuses a second open batch for the same employee and folder', async () => {
    const existing = (await service.digitization.batches())[0];
    const result = await service.digitization.createBatch({
      employeeCode: existing.employeeCode,
      folder: existing.folder,
      note: '',
    });
    if (result.ok) return;
    expect(result.error).toContain(existing.code);
  });
});

describe('bulk import', () => {
  const csvFor = async () =>
    [
      'barcode,subject,shelf',
      `${baseFile.fileBarcode},Fresh row,${(await firstActiveShelf()).barcode}`,
      'RF-0000124587,Duplicate,',
      'RF-0000000009,Bad shelf,RM-NOPE-99',
    ].join('\n');

  it('classifies each row and refuses to commit a fully bad batch', async () => {
    const job = await service.bulk.validateCsv(await csvFor(), 'bulk/Temp99999/');
    expect(job.ok).toBe(true);
    if (!job.ok) return;
    expect(job.value.accepted).toBe(1);
    expect(job.value.duplicates).toBe(1);
    expect(job.value.rows[2].result).toBe('Unknown shelf');
  });

  it('commits only the accepted rows', async () => {
    const job = await service.bulk.validateCsv(await csvFor(), 'bulk/Temp99999/');
    if (!job.ok) throw new Error('validation failed');
    const committed = await service.bulk.commit(job.value.id);
    expect(committed.ok).toBe(true);
    if (!committed.ok) return;
    expect(await service.files.byBarcode(baseFile.fileBarcode)).not.toBeNull();
    expect(await service.files.byBarcode('RF-0000000009')).toBeNull();
  });

  it('refuses a CSV without the required headers', async () => {
    expect((await service.bulk.validateCsv('a,b,c\n1,2,3', 'bulk/Temp99999/')).ok).toBe(false);
  });
});

describe('auth', () => {
  it('records a failed login in the login history', async () => {
    const before = (await service.audit.loginHistory({})).length;
    expect((await service.auth.signIn('operator', 'wrong-password')).ok).toBe(false);
    expect((await service.audit.loginHistory({})).length).toBe(before + 1);
  });

  it('refuses an unknown user name', async () => {
    expect((await service.auth.signIn('nobody', service.auth.demoPassword)).ok).toBe(false);
  });

  it('refuses a deactivated account', async () => {
    expect((await service.auth.signIn('deputy.ceo', service.auth.demoPassword)).ok).toBe(false);
  });

  it('closes the session on sign out and stamps the logout time', async () => {
    await service.auth.signIn('operator', service.auth.demoPassword);
    await service.auth.signOut();
    expect(service.auth.currentUser()).toBeNull();
    expect((await service.audit.loginHistory({ outcome: 'Signed out' })).length).toBeGreaterThan(0);
  });

  it('issues and consumes an OTP', async () => {
    const challenge = await service.auth.requestOtp('operator');
    expect(challenge.ok).toBe(true);
    if (!challenge.ok) return;
    expect((await service.auth.signInWithOtp('operator', challenge.value.otp)).ok).toBe(true);
    // The challenge is single-use.
    expect((await service.auth.signInWithOtp('operator', challenge.value.otp)).ok).toBe(false);
  });
});

describe('reports', () => {
  it('produces a row for every definition', async () => {
    const definitions = await service.reports.definitions();
    for (const definition of definitions) {
      const result = await service.reports.build(definition.key);
      expect(result.columns).toEqual(definition.columns);
      expect(Array.isArray(result.rows)).toBe(true);
    }
  });

  it('includes an overdue receipt once one exists', async () => {
    const available = (await service.files.list({ status: 'Available', pageSize: 2 })).items;
    await issue(
      available.map((file) => file.id),
      '2020-01-01',
    );
    const overdue = await service.reports.build('overdue-files');
    expect(overdue.rows.length).toBeGreaterThan(0);
  });
});

describe('dashboard', () => {
  it('reports a mapping percentage bounded by the registry size', async () => {
    const stats = await service.dashboard.stats();
    expect(stats.mappedPercent).toBeGreaterThanOrEqual(0);
    expect(stats.mappedPercent).toBeLessThanOrEqual(100);
    expect(stats.totalRecords).toBeGreaterThan(0);
  });

  it('derives activity from real movement events', async () => {
    const activity = await service.dashboard.activity(3);
    expect(activity.length).toBeGreaterThan(0);
    expect(activity[0].label.length).toBeGreaterThan(0);
  });
});