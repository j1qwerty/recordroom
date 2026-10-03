/**
 * DTO → frontend type mapping for the HTTP adapter.
 *
 * The API speaks in integer ids and PascalCase DTOs; the frontend contract uses
 * string ids and a flatter shape. All of that difference is absorbed here so
 * the adapters above deal only in frontend types.
 *
 * Fields the API does not carry are mapped deliberately rather than left
 * undefined, and each one is commented: a silent `undefined` in a field the UI
 * renders is worse than a documented placeholder.
 */

import type {
  AppUser,
  Area,
  AuditEntry,
  BarcodeJob,
  BarcodePayload,
  BulkImportJob,
  BulkImportRow,
  DashboardStats,
  DigitizationBatch,
  DigitizationPage,
  Employee,
  IssueLine,
  IssueRecord,
  LoginHistoryEntry,
  MapUpload,
  MovementEvent,
  RecordFile,
  ReportDefinition,
  Room,
  ScanResult,
  Section,
  Shelf,
  StorageUnit,
  TimelineEvent,
} from '../../types';
import type { ReportKey } from '../../types';
import { toId } from './client';

const str = (value: unknown): string =>
  value === null || value === undefined ? '' : String(value);

const num = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

// ---------------------------------------------------------------- identity

export function toAppUser(dto: Record<string, unknown>): AppUser {
  return {
    id: toId(dto.id as number),
    userName: str(dto.userName),
    displayName: str(dto.displayName),
    role: str(dto.role) as AppUser['role'],
    employeeCode: dto.employeeCode ? str(dto.employeeCode) : undefined,
    active: dto.active === true,
    lastLoginAt: str(dto.lastLoginAt),
  };
}

// --------------------------------------------------------------- locations

export function toShelf(dto: Record<string, unknown>, almirahId: string): Shelf {
  return {
    id: toId(dto.id as number),
    almirahId,
    barcode: str(dto.barcode),
    code: str(dto.code),
    name: str(dto.name),
    status: str(dto.status) as Shelf['status'],
    capacity: num(dto.capacity, 80),
    occupied: num(dto.occupied),
    position: num(dto.position),
  };
}

export function toUnit(dto: Record<string, unknown>, roomId: string): StorageUnit {
  const id = toId(dto.id as number);
  const shelves = Array.isArray(dto.shelves)
    ? (dto.shelves as Record<string, unknown>[]).map((shelf) => toShelf(shelf, id))
    : [];

  return {
    id,
    roomId,
    sectionId: '',
    barcode: str(dto.barcode),
    code: str(dto.code),
    name: str(dto.name),
    type: (str(dto.type) || 'Almirah') as StorageUnit['type'],
    status: str(dto.status) as StorageUnit['status'],
    x: num(dto.x),
    y: num(dto.y),
    width: num(dto.width),
    height: num(dto.height),
    shelves,
  };
}

export function toSection(dto: Record<string, unknown>, roomId: string): Section {
  const units = Array.isArray(dto.storageUnits)
    ? (dto.storageUnits as Record<string, unknown>[]).map((unit) => {
        const mapped = toUnit(unit, roomId);
        mapped.sectionId = toId(dto.id as number);
        return mapped;
      })
    : [];

  return {
    id: toId(dto.id as number),
    roomId,
    code: str(dto.code),
    name: str(dto.name),
    status: str(dto.status) as Section['status'],
    // The API does not expose section timestamps; the UI only shows them as
    // metadata, so an empty string is honest rather than a fabricated date.
    createdAt: '',
    updatedAt: '',
    // Units are attached by toRoom, which also needs them on the room itself.
    ...({ storageUnits: units } as Record<string, unknown>),
  } as Section;
}

export function toRoom(dto: Record<string, unknown>): Room {
  const roomId = toId(dto.id as number);
  const units = Array.isArray(dto.storageUnits)
    ? (dto.storageUnits as Record<string, unknown>[]).map((unit) => toUnit(unit, roomId))
    : [];
  const unitById = new Map(units.map((unit) => [unit.id, unit]));

  const sections = Array.isArray(dto.sections)
    ? (dto.sections as Record<string, unknown>[]).map((section) => {
        const mapped = toSection(section, roomId);
        // The API returns each room's units once, alongside its sections. Attach
        // the matching subset so the tree can be walked from either direction.
        const own = units.filter((unit) => unit.sectionId === mapped.id);
        return { ...mapped, storageUnits: own } as Section & { storageUnits: StorageUnit[] };
      })
    : [];

  // A unit whose section is not listed would otherwise vanish from the room.
  const listed = new Set(
    sections.flatMap((section) => (section.storageUnits ?? []).map((u) => u.id)),
  );
  for (const unit of units) {
    if (!listed.has(unit.id)) unitById.set(unit.id, unit);
  }

  return {
    id: roomId,
    code: str(dto.code),
    name: str(dto.name),
    building: str(dto.building),
    floor: str(dto.floor),
    occupancy: num(dto.occupancy),
    capacity: num(dto.capacity),
    status: str(dto.status) as Room['status'],
    sections: sections as Section[],
    storageUnits: units,
  };
}

export function toArea(dto: Record<string, unknown>): Area {
  return {
    id: toId(dto.id as number),
    name: str(dto.name),
    pincode: str(dto.pincode),
    // The API sends a boolean; the UI colours on the word.
    status: dto.active === true ? 'Active' : 'Inactive',
  };
}

// ------------------------------------------------------------------- files

export function toFile(dto: Record<string, unknown>): RecordFile {
  const fileBarcode = str(dto.fileBarcode);
  return {
    id: toId(dto.id as number),
    fileBarcode,
    // The API has no separate rfId column; the legacy alias is the barcode.
    rfId: fileBarcode,
    fileNumber: str(dto.fileNumber),
    subject: str(dto.subject),
    department: str(dto.department),
    year: num(dto.year),
    fileType: str(dto.fileType) as RecordFile['fileType'],
    status: str(dto.status) as RecordFile['status'],
    location: str(dto.location),
    roomId: dto.roomId === null || dto.roomId === undefined ? '' : toId(dto.roomId as number),
    sectionId: '',
    section: str(dto.section),
    almirahId: '',
    almirah: str(dto.almirah),
    shelfId: '',
    shelf: str(dto.shelf),
    shelfBarcode: str(dto.shelfBarcode),
    position: num(dto.position),
    pincode: str(dto.pincode),
    area: str(dto.area),
    propertyNo: str(dto.propertyNo),
    propertyArea: str(dto.propertyArea),
    dealer: str(dto.dealer),
    codalLife: str(dto.codalLife),
    createdAt: str(dto.createdAt),
    createdBy: str(dto.createdBy),
    updatedAt: str(dto.updatedAt),
    updatedBy: str(dto.updatedBy),
    lastMovement: str(dto.lastMovement),
    holder: dto.holder ? str(dto.holder) : undefined,
    holderEmployeeCode: dto.holderEmployeeCode ? str(dto.holderEmployeeCode) : undefined,
    description: str(dto.description),
  };
}

// ------------------------------------------------------------------ issues

export function toIssue(dto: Record<string, unknown>): IssueRecord {
  const issuedAt = str(dto.issuedAt);
  return {
    id: toId(dto.id as number),
    receiptNumber: str(dto.receiptNumber),
    borrowerType: str(dto.borrowerType) as IssueRecord['borrowerType'],
    borrowerName: str(dto.borrowerName),
    borrowerEmployeeCode: str(dto.borrowerEmployeeCode),
    department: str(dto.department),
    purpose: str(dto.purpose),
    lines: (Array.isArray(dto.lines) ? (dto.lines as Record<string, unknown>[]) : []).map(
      (line): IssueLine => ({
        fileId: toId(line.fileId as number),
        fileBarcode: str(line.fileBarcode),
        returnedAt: line.returnedAt ? str(line.returnedAt) : null,
      }),
    ),
    issuedAt,
    dueAt: str(dto.dueAt),
    returnedAt: dto.returnedAt ? str(dto.returnedAt) : null,
    status: str(dto.status) as IssueRecord['status'],
    remark: str(dto.remark),
    issuedBy: str(dto.issuedBy),
    // The API has no separate createdAt; the receipt is created when issued.
    createdAt: issuedAt,
  };
}

// --------------------------------------------------------------- movement

export function toMovement(dto: Record<string, unknown>): MovementEvent {
  return {
    id: toId(dto.id as number),
    kind: str(dto.kind) as MovementEvent['kind'],
    fileId: toId(dto.fileId as number),
    fileBarcode: str(dto.fileBarcode),
    subject: str(dto.subject),
    from: str(dto.from),
    to: str(dto.to),
    actor: str(dto.actor),
    at: str(dto.at),
    detail: str(dto.detail),
    issueId:
      dto.issueId === null || dto.issueId === undefined ? undefined : toId(dto.issueId as number),
  };
}

// ------------------------------------------------------------------ audit

export function toAuditEntry(dto: Record<string, unknown>): AuditEntry {
  return {
    id: toId(dto.id as number),
    action: str(dto.action) as AuditEntry['action'],
    entity: str(dto.entity),
    entityId: str(dto.entityId),
    actor: str(dto.actor),
    role: str(dto.role) as AuditEntry['role'],
    at: str(dto.at),
    ip: str(dto.ip),
    before: str(dto.before),
    after: str(dto.after),
    summary: str(dto.summary),
  };
}

export function toLoginHistory(dto: Record<string, unknown>): LoginHistoryEntry {
  return {
    id: toId(dto.id as number),
    userName: str(dto.userName),
    role: str(dto.role) as LoginHistoryEntry['role'],
    channel: str(dto.channel) as LoginHistoryEntry['channel'],
    ip: str(dto.ip),
    userAgent: str(dto.userAgent),
    loginAt: str(dto.loginAt),
    logoutAt: dto.logoutAt ? str(dto.logoutAt) : null,
    outcome: str(dto.outcome) as LoginHistoryEntry['outcome'],
    detail: str(dto.detail),
  };
}

// ------------------------------------------------------------------ people

export function toEmployee(dto: Record<string, unknown>): Employee {
  return {
    id: toId(dto.id as number),
    employeeCode: str(dto.employeeCode),
    prefix: str(dto.prefix),
    name: str(dto.name),
    fatherName: str(dto.fatherName),
    gender: (str(dto.gender) || 'Male') as Employee['gender'],
    dateOfBirth: str(dto.dateOfBirth),
    department: str(dto.department),
    designation: str(dto.designation),
    email: str(dto.email),
    mobile: str(dto.mobile),
    pan: str(dto.pan),
    aadhaar: str(dto.aadhaar),
    role: str(dto.role) as Employee['role'],
    gradePay: str(dto.gradePay),
    payScale: str(dto.payScale),
    status: str(dto.status) as Employee['status'],
    createdAt: str(dto.createdAt),
    modifiedAt: str(dto.modifiedAt),
  };
}

// ----------------------------------------------------------- digitization

export function toPage(dto: Record<string, unknown>): DigitizationPage {
  return {
    id: toId(dto.id as number),
    batchId: toId(dto.batchId as number),
    fileBarcode: str(dto.fileBarcode),
    filename: str(dto.fileName),
    pageNo: num(dto.pageNo, 1),
    version: num(dto.version, 1),
    status: str(dto.status) as DigitizationPage['status'],
    note: str(dto.note),
    uploadedAt: str(dto.uploadedAt),
    uploadedBy: str(dto.uploadedBy),
    bulk: dto.bulk === true,
  };
}

export function toBatch(dto: Record<string, unknown>): DigitizationBatch {
  return {
    id: toId(dto.id as number),
    code: str(dto.code),
    employeeCode: str(dto.employeeCode),
    employeeName: str(dto.employeeName),
    department: str(dto.department),
    folder: str(dto.folder) as DigitizationBatch['folder'],
    status: str(dto.status) as DigitizationBatch['status'],
    pages: (Array.isArray(dto.pages) ? (dto.pages as Record<string, unknown>[]) : []).map(toPage),
    createdAt: str(dto.createdAt),
    createdBy: str(dto.createdBy),
    submittedAt: dto.submittedAt ? str(dto.submittedAt) : null,
  };
}

export function toMapUpload(dto: Record<string, unknown>): MapUpload {
  return {
    id: toId(dto.id as number),
    fileBarcode: str(dto.barcode),
    filename: str(dto.fileName),
    pageNo: num(dto.pageNo, 1),
    version: num(dto.version, 1),
    status: str(dto.status) as MapUpload['status'],
    uploadedAt: str(dto.uploadedAt),
    uploadedBy: str(dto.uploadedBy),
    sizeKb: num(dto.sizeKb),
  };
}

// ------------------------------------------------------------------- bulk

export function toBulkJob(dto: Record<string, unknown>): BulkImportJob {
  return {
    id: toId(dto.id as number),
    filename: str(dto.fileName),
    folder: str(dto.folder),
    createdAt: str(dto.createdAt),
    createdBy: str(dto.createdBy),
    status: str(dto.status) as BulkImportJob['status'],
    rows: (Array.isArray(dto.rows) ? (dto.rows as Record<string, unknown>[]) : []).map(
      (row): BulkImportRow => ({
        rowNo: num(row.rowNo),
        fileBarcode: str(row.fileBarcode),
        subject: str(row.subject),
        shelfBarcode: str(row.shelfBarcode),
        result: str(row.result) as BulkImportRow['result'],
        detail: str(row.detail),
      }),
    ),
    accepted: num(dto.accepted),
    rejected: num(dto.rejected),
    duplicates: num(dto.duplicates),
  };
}

// --------------------------------------------------------------- dashboard

export function toStats(dto: Record<string, unknown>): DashboardStats {
  return {
    totalRecords: num(dto.totalRecords),
    mappedPercent: num(dto.mappedPercent),
    issuedNow: num(dto.issuedNow),
    dueToday: num(dto.dueToday),
    digitizationPercent: num(dto.digitizationPercent),
    overdueCount: num(dto.overdueCount),
    roomCount: num(dto.roomCount),
    activeBorrowers: num(dto.activeBorrowers),
    pendingApprovals: num(dto.pendingApprovals),
  };
}

export function toTimeline(dto: Record<string, unknown>): TimelineEvent {
  return {
    id: str(dto.id),
    label: str(dto.label),
    date: str(dto.date),
    actor: str(dto.actor),
    detail: str(dto.detail),
    tone: (str(dto.tone) || 'default') as TimelineEvent['tone'],
  };
}

// --------------------------------------------------------------- barcodes

export function toPayload(dto: Record<string, unknown>): BarcodePayload {
  return {
    subject: str(dto.subject) as BarcodePayload['subject'],
    symbology: (str(dto.symbology) || 'Code128') as BarcodePayload['symbology'],
    value: str(dto.value),
    label: str(dto.label),
    meta: str(dto.meta),
    valid: dto.valid === true,
    reason: dto.reason ? str(dto.reason) : undefined,
  };
}

export function toScanResult(dto: Record<string, unknown>): ScanResult {
  return {
    ok: dto.ok === true,
    payload: dto.payload ? toPayload(dto.payload as Record<string, unknown>) : null,
    message: str(dto.message),
  };
}

export function toBarcodeJob(dto: Record<string, unknown>): BarcodeJob {
  return {
    id: toId(dto.id as number),
    subject: str(dto.subject) as BarcodeJob['subject'],
    targetId: str(dto.targetId),
    label: str(dto.label),
    // Print jobs are always Code 128; QR is a sticker variant of the same value.
    symbology: 'Code128',
    value: str(dto.value),
    quantity: num(dto.quantity),
    requestedBy: str(dto.requestedBy),
    createdAt: str(dto.createdAt),
    status: str(dto.status) as BarcodeJob['status'],
  };
}

// ---------------------------------------------------------------- reports

export function toReportDefinition(dto: Record<string, unknown>): ReportDefinition {
  return {
    key: str(dto.key) as ReportKey,
    title: str(dto.title),
    description: str(dto.description),
    columns: (Array.isArray(dto.columns) ? (dto.columns as unknown[]) : []).map(str),
    legacySource: str(dto.legacySource),
  };
}
