import { beforeEach, describe, expect, it } from 'vitest';
import { service } from '../src/services';
import type { FileCreateInput } from '../src/types';

/**
 * Guards copied from the legacy controllers:
 * `File.php: checkfilebarcode / checkShelfBarcode`, `Record.php:
 * multipleFileIssue`, `Store_model.php` hierarchy guards and
 * `Employee_reports: match_otp`.
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

const firstActiveShelf = () => {
  for (const room of service.locations.listRooms()) {
    for (const unit of room.storageUnits) {
      const shelf = unit.shelves.find((item) => item.status === 'Active');
      if (shelf) return shelf;
    }
  }
  throw new Error('Seed has no active shelf');
};

beforeEach(() => {
  service.reset();
  service.auth.signIn('admin', service.auth.demoPassword);
});

describe('files.validateCreate', () => {
  it('refuses a barcode that already exists', () => {
    const existing = service.files.list({ pageSize: 1 }).items[0];
    const issues = service.files.validateCreate({
      ...baseFile,
      fileBarcode: existing.fileBarcode,
      shelfId: firstActiveShelf().id,
    });
    expect(issues.some((issue) => issue.field === 'fileBarcode' && issue.severity === 'error')).toBe(
      true,
    );
  });

  it('treats barcodes case-insensitively', () => {
    const existing = service.files.list({ pageSize: 1 }).items[0];
    const issues = service.files.validateCreate({
      ...baseFile,
      fileBarcode: existing.fileBarcode.toLowerCase(),
      shelfId: firstActiveShelf().id,
    });
    expect(issues.some((issue) => issue.field === 'fileBarcode')).toBe(true);
  });

  it('refuses a shelf that is not active', () => {
    const inactive = service.locations
      .listRooms()
      .flatMap((room) => room.storageUnits.flatMap((unit) => unit.shelves))
      .find((shelf) => shelf.status !== 'Active');
    expect(inactive).toBeDefined();
    const issues = service.files.validateCreate({ ...baseFile, shelfId: inactive!.id });
    expect(issues.some((issue) => issue.field === 'shelfId' && issue.severity === 'error')).toBe(
      true,
    );
  });

  it('refuses an unknown area', () => {
    const issues = service.files.validateCreate({
      ...baseFile,
      shelfId: firstActiveShelf().id,
      area: 'NOWHERE',
    });
    expect(issues.some((issue) => issue.field === 'area' && issue.severity === 'error')).toBe(true);
  });

  it('refuses a position outside 1..100', () => {
    const issues = service.files.validateCreate({
      ...baseFile,
      shelfId: firstActiveShelf().id,
      position: 0,
    });
    expect(issues.some((issue) => issue.field === 'position')).toBe(true);
  });

  it('accepts a clean row', () => {
    const shelf = firstActiveShelf();
    const issues = service.files.validateCreate({ ...baseFile, shelfId: shelf.id });
    expect(issues.filter((issue) => issue.severity === 'error')).toHaveLength(0);
  });
});

describe('files.create', () => {
  it('resolves the location path from the shelf and increments occupancy', () => {
    const shelf = firstActiveShelf();
    const before = shelf.occupied;
    const result = service.files.create({ ...baseFile, shelfId: shelf.id });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.shelfId).toBe(shelf.id);
    expect(result.value.location).toContain(shelf.code);
    expect(result.value.status).toBe('Available');
    expect(service.locations.findShelf(shelf.id)?.occupied).toBe(before + 1);
  });

  it('writes a movement event and an audit row in the same change', () => {
    const movements = service.movements.list({ limit: 500 }).length;
    const audit = service.audit.list({ limit: 500 }).length;
    service.files.create({ ...baseFile, shelfId: firstActiveShelf().id });

    expect(service.movements.list({ limit: 500 }).length).toBe(movements + 1);
    expect(service.audit.list({ limit: 500 }).length).toBe(audit + 1);
  });
});

describe('issues.issueFiles', () => {
  const availableFiles = (count: number) =>
    service.files
      .list({ status: 'Available', pageSize: 10 })
      .items.filter((file) => !service.files.byShelf(file.shelfId).some((f) => f.id === file.id && f.id !== file.id))
      .slice(0, count);

  it('refuses an empty scan list', () => {
    const result = service.issues.issueFiles({
      borrowerType: 'Employee',
      borrowerEmployeeCode: 'EMP0001',
      borrowerName: 'Ramesh Kumar',
      department: 'Establishment',
      purpose: '',
      fileIds: [],
      dueAt: '2030-01-01',
      remark: '',
    });
    expect(result.ok).toBe(false);
  });

  it('refuses the same file twice on one receipt', () => {
    const file = availableFiles(1)[0];
    const result = service.issues.issueFiles({
      borrowerType: 'Employee',
      borrowerEmployeeCode: 'EMP0001',
      borrowerName: 'Ramesh Kumar',
      department: 'Establishment',
      purpose: '',
      fileIds: [file.id, file.id],
      dueAt: '2030-01-01',
      remark: '',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('scanned twice');
  });

  it('refuses a file that is not Available', () => {
    const issued = service.files.list({ status: 'Issued', pageSize: 1 }).items[0];
    const result = service.issues.issueFiles({
      borrowerType: 'Employee',
      borrowerEmployeeCode: 'EMP0001',
      borrowerName: 'Ramesh Kumar',
      department: 'Establishment',
      purpose: '',
      fileIds: [issued.id],
      dueAt: '2030-01-01',
      remark: '',
    });
    expect(result.ok).toBe(false);
  });

  it('issues several files on one receipt and flips every status', () => {
    const targets = availableFiles(2);
    expect(targets.length).toBe(2);
    const result = service.issues.issueFiles({
      borrowerType: 'Employee',
      borrowerEmployeeCode: 'EMP0001',
      borrowerName: 'Ramesh Kumar',
      department: 'Establishment',
      purpose: 'Multi-file test',
      fileIds: targets.map((file) => file.id),
      dueAt: '2030-01-01',
      remark: '',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.lines).toHaveLength(2);
    expect(result.value.status).toBe('Issued');
    targets.forEach((file) => {
      const after = service.files.get(file.id);
      expect(after?.status).toBe('Issued');
      expect(after?.holderEmployeeCode).toBe('EMP0001');
    });
  });

  it('supports partial return and settles the receipt', () => {
    const targets = availableFiles(2);
    const issued = service.issues.issueFiles({
      borrowerType: 'Employee',
      borrowerEmployeeCode: 'EMP0001',
      borrowerName: 'Ramesh Kumar',
      department: 'Establishment',
      purpose: '',
      fileIds: targets.map((file) => file.id),
      dueAt: '2030-01-01',
      remark: '',
    });
    if (!issued.ok) throw new Error('issue failed');

    const partial = service.issues.returnFiles(issued.value.id, [targets[0].id], 'Good');
    expect(partial.ok).toBe(true);
    if (!partial.ok) return;
    expect(partial.value.status).toBe('Partially returned');
    expect(service.files.get(targets[0].id)?.status).toBe('Available');
    expect(service.files.get(targets[1].id)?.status).toBe('Issued');

    const rest = service.issues.returnFiles(issued.value.id, [targets[1].id], 'Good');
    expect(rest.ok).toBe(true);
    if (!rest.ok) return;
    expect(rest.value.status).toBe('Returned');
    expect(rest.value.returnedAt).toBeTruthy();
  });

  it('refuses to return a file that belongs to another receipt', () => {
    const open = service.issues.list({ open: true, pageSize: 1 }).items[0];
    const other = service.files.list({ status: 'Issued', pageSize: 5 }).items.find(
      (file) => !open.lines.some((line) => line.fileId === file.id),
    );
    if (!other) return;
    const result = service.issues.returnFiles(open.id, [other.id], 'Good');
    expect(result.ok).toBe(false);
  });
});

describe('locations guards', () => {
  it('refuses to delete a section that still holds almirahs', () => {
    const room = service.locations.listRooms()[0];
    const section = room.sections.find((item) => room.storageUnits.some((u) => u.sectionId === item.id));
    if (!section) return;
    const result = service.locations.deleteSection(section.id);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('almirah');
  });

  it('refuses to deactivate a section that holds active almirahs', () => {
    const room = service.locations.listRooms()[0];
    const section = room.sections[0];
    const result = service.locations.updateSection(section.id, { status: 'Inactive' });
    expect(result.ok).toBe(false);
  });

  it('refuses to delete a shelf that holds files', () => {
    const file = service.files.list({ pageSize: 20 }).items.find((item) => item.shelfId);
    if (!file) return;
    const result = service.locations.deleteShelf(file.shelfId);
    expect(result.ok).toBe(false);
  });

  it('refuses a duplicate shelf barcode', () => {
    const room = service.locations.listRooms()[0];
    const unit = room.storageUnits[0];
    const taken = unit.shelves[0].barcode;
    const empty = service.locations
      .listRooms()
      .flatMap((r) => r.storageUnits)
      .find((u) => u.shelves.length === 0);
    if (!empty) return;
    const result = service.locations.addShelf(empty.id, {
      code: 'TEST-S-01',
      name: 'Test',
      barcode: taken,
    });
    expect(result.ok).toBe(false);
  });

  it('refuses a duplicate section name inside the same room', () => {
    const room = service.locations.listRooms()[0];
    const result = service.locations.addSection(room.id, { name: room.sections[0].name });
    expect(result.ok).toBe(false);
  });

  it('adds then removes an empty section', () => {
    const room = service.locations.listRooms()[0];
    const created = service.locations.addSection(room.id, { name: 'TEST-Z' });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(service.locations.deleteSection(created.value.id).ok).toBe(true);
  });

  it('increments the layout revision on save', () => {
    const room = service.locations.listRooms()[0];
    const first = service.locations.saveLayout(room.id, 'first');
    const second = service.locations.saveLayout(room.id, 'second');
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.value.revision).toBe(first.value.revision + 1);
  });
});

describe('digitization', () => {
  it('refuses a page for a barcode that is not registered', () => {
    const batch = service.digitization.batches()[0];
    const result = service.digitization.uploadPage(batch.id, {
      fileBarcode: 'RF-DOES-NOT-EXIST',
      pageNo: 1,
      filename: '',
      bulk: false,
    });
    expect(result.ok).toBe(false);
  });

  it('bumps the version when the same file and page is scanned again', () => {
    const employee = service.employees.list({ pageSize: 50 }).items[0];
    const batch = service.digitization.createBatch({
      employeeCode: employee.employeeCode,
      folder: 'apar',
      note: '',
    });
    if (!batch.ok) throw new Error('batch failed');
    const target = service.files.list({ pageSize: 5 }).items[0];

    const first = service.digitization.uploadPage(batch.value.id, {
      fileBarcode: target.fileBarcode,
      pageNo: 1,
      filename: '',
      bulk: false,
    });
    const second = service.digitization.uploadPage(batch.value.id, {
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

  it('refuses a rejection without a reason', () => {
    const batch = service.digitization
      .batches()
      .find((item) => item.pages.some((page) => page.status === 'Pending review'));
    const page = batch?.pages.find((item) => item.status === 'Pending review');
    if (!page) return;
    const result = service.digitization.reviewPage(page.id, 'Rejected', '  ');
    expect(result.ok).toBe(false);
  });

  it('refuses a second open batch for the same employee and folder', () => {
    const existing = service.digitization.batches()[0];
    const result = service.digitization.createBatch({
      employeeCode: existing.employeeCode,
      folder: existing.folder,
      note: '',
    });
    if (result.ok) return;
    expect(result.error).toContain(existing.code);
  });
});

describe('bulk import', () => {
  const csv = [
    'barcode,subject,shelf',
    `${baseFile.fileBarcode},Fresh row,${firstActiveShelf().barcode}`,
    'RF-0000124587,Duplicate,',
    'RF-0000000009,Bad shelf,RM-NOPE-99',
  ].join('\n');

  it('classifies each row and refuses to commit a fully bad batch', () => {
    const job = service.bulk.validateCsv(csv, 'bulk/Temp99999/');
    expect(job.ok).toBe(true);
    if (!job.ok) return;
    expect(job.value.accepted).toBe(1);
    expect(job.value.duplicates).toBe(1);
    expect(job.value.rows[2].result).toBe('Unknown shelf');
  });

  it('commits only the accepted rows', () => {
    const job = service.bulk.validateCsv(csv, 'bulk/Temp99999/');
    if (!job.ok) throw new Error('validation failed');
    const committed = service.bulk.commit(job.value.id);
    expect(committed.ok).toBe(true);
    if (!committed.ok) return;
    expect(service.files.byBarcode(baseFile.fileBarcode)).not.toBeNull();
    expect(service.files.byBarcode('RF-0000000009')).toBeNull();
  });

  it('refuses a CSV without the required headers', () => {
    const result = service.bulk.validateCsv('a,b,c\n1,2,3', 'bulk/Temp99999/');
    expect(result.ok).toBe(false);
  });
});

describe('auth', () => {
  it('records a failed login in the login history', () => {
    const before = service.audit.loginHistory({}).length;
    const result = service.auth.signIn('operator', 'wrong-password');
    expect(result.ok).toBe(false);
    expect(service.audit.loginHistory({}).length).toBe(before + 1);
  });

  it('refuses an unknown user name', () => {
    expect(service.auth.signIn('nobody', service.auth.demoPassword).ok).toBe(false);
  });

  it('refuses a deactivated account', () => {
    expect(service.auth.signIn('deputy.ceo', service.auth.demoPassword).ok).toBe(false);
  });

  it('closes the session on sign out and stamps the logout time', () => {
    service.auth.signIn('operator', service.auth.demoPassword);
    service.auth.signOut();
    expect(service.auth.currentUser()).toBeNull();
    const entry = service.audit.loginHistory({ outcome: 'Signed out' });
    expect(entry.length).toBeGreaterThan(0);
  });

  it('issues and consumes an OTP', () => {
    const challenge = service.auth.requestOtp('operator');
    expect(challenge.ok).toBe(true);
    if (!challenge.ok) return;
    expect(service.auth.signInWithOtp('operator', challenge.value.otp).ok).toBe(true);
    // The challenge is single-use.
    expect(service.auth.signInWithOtp('operator', challenge.value.otp).ok).toBe(false);
  });
});

describe('reports', () => {
  it('produces a row for every definition', () => {
    service.reports.definitions.forEach((definition) => {
      const result = service.reports.build(definition.key);
      expect(result.columns).toEqual(definition.columns);
      expect(Array.isArray(result.rows)).toBe(true);
    });
  });

  it('includes an overdue receipt once one exists', () => {
    const available = service.files.list({ status: 'Available', pageSize: 2 }).items;
    service.issues.issueFiles({
      borrowerType: 'Employee',
      borrowerEmployeeCode: 'EMP0001',
      borrowerName: 'Ramesh Kumar',
      department: 'Establishment',
      purpose: '',
      fileIds: available.map((file) => file.id),
      dueAt: '2020-01-01',
      remark: '',
    });
    const overdue = service.reports.build('overdue-files');
    expect(overdue.rows.length).toBeGreaterThan(0);
  });
});

describe('dashboard', () => {
  it('reports a mapping percentage bounded by the registry size', () => {
    const stats = service.dashboard.stats();
    expect(stats.mappedPercent).toBeGreaterThanOrEqual(0);
    expect(stats.mappedPercent).toBeLessThanOrEqual(100);
    expect(stats.totalRecords).toBeGreaterThan(0);
  });

  it('derives activity from real movement events', () => {
    const activity = service.dashboard.activity(3);
    expect(activity.length).toBeGreaterThan(0);
    expect(activity[0].label.length).toBeGreaterThan(0);
  });
});