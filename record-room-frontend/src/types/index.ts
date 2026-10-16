/**
 * Domain types for the record-room platform.
 *
 * These mirror the legacy SQL schema (`jhs_digitization_db (1).sql`) so the
 * service layer in `src/services/` can be replaced by the planned .NET 10 +
 * SQLite API without changing any page.
 */

// ---------------------------------------------------------------- auth/roles

export const ROLES = ['Admin', 'Supervisor', 'Operator', 'Employee'] as const;
export type Role = (typeof ROLES)[number];

export interface AppUser {
  id: string;
  userName: string;
  /** Display name shown in the shell and audit trail. */
  displayName: string;
  role: Role;
  /** Links a login to `drm_employee` when the user is an employee. */
  employeeCode?: string;
  active: boolean;
  lastLoginAt: string;
}

export type LoginOutcome = 'Success' | 'Failed' | 'Signed out';

export interface LoginHistoryEntry {
  id: string;
  userName: string;
  role: Role;
  channel: 'Web' | 'Mobile';
  ip: string;
  userAgent: string;
  loginAt: string;
  logoutAt: string | null;
  outcome: LoginOutcome;
  detail: string;
}

// ------------------------------------------------------------------ employees

export type EmployeeStatus = 'Active' | 'Inactive' | 'Retired';

export interface Employee {
  id: string;
  employeeCode: string;
  prefix: string;
  name: string;
  fatherName: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  department: string;
  designation: string;
  email: string;
  mobile: string;
  pan: string;
  aadhaar: string;
  role: Role;
  gradePay: string;
  payScale: string;
  status: EmployeeStatus;
  createdAt: string;
  modifiedAt: string;
}

// ------------------------------------------------------------------- location

export type StorageStatus = 'Active' | 'Maintenance' | 'Inactive' | 'Decommissioned';

export interface Area {
  id: string;
  name: string;
  pincode: string;
  status: 'Active' | 'Inactive';
}

/** `section_tbl` — room → section → almirah → shelf. */
export interface Section {
  id: string;
  roomId: string;
  code: string;
  name: string;
  status: StorageStatus;
  createdAt: string;
  updatedAt: string;
}

/** `shelf_tbl`. */
export interface Shelf {
  id: string;
  almirahId: string;
  /** Physical label barcode; a file may only reference an active shelf. */
  barcode: string;
  code: string;
  name: string;
  status: StorageStatus;
  capacity: number;
  occupied: number;
  position: number;
}

/** `almirah_tbl`. */
export interface StorageUnit {
  id: string;
  sectionId: string;
  roomId: string;
  barcode: string;
  code: string;
  name: string;
  type: 'Almirah' | 'Rack' | 'Cabinet';
  status: StorageStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  shelves: Shelf[];
}

/** `room_tbl`. */
export interface Room {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: string;
  occupancy: number;
  capacity: number;
  status: 'Operational' | 'Restricted' | 'Maintenance';
  sections: Section[];
  storageUnits: StorageUnit[];
}

// ---------------------------------------------------------------------- files

export type FileStatus = 'Available' | 'Issued' | 'Under Digitization' | 'Missing' | 'Archived';
export type FileType = 'Letter' | 'File' | 'Register' | 'Map' | 'Drawing' | 'Report';
export type RecordKind = 'File' | 'Map';
export type DocumentSize = 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'Other';

/** `file_tbl`. */
export interface RecordFile {
  id: string;
  /** Stable physical-file identity (`file_barcode`, UNIQUE in legacy). */
  fileBarcode: string;
  /** Legacy display alias kept because the UI and mock data reference RF ids. */
  rfId: string;
  fileNumber: string;
  subject: string;
  department: string;
  year: number;
  fileType: FileType;
  /** Operational distinction between a physical record file and a large-format map. */
  recordKind?: RecordKind;
  /** Physical sheet/document size; A0 records default to Map at creation time. */
  documentSize?: DocumentSize;
  /** Optional e-office file name or identifier assigned by the external record system. */
  eOfficeReference?: string;
  status: FileStatus;
  location: string;
  roomId: string;
  sectionId: string;
  section: string;
  almirahId: string;
  almirah: string;
  shelfId: string;
  shelf: string;
  /** `file_tbl.shelf_barcode` — must exist and be active. */
  shelfBarcode: string;
  position: number;
  pincode: string;
  area: string;
  propertyNo: string;
  propertyArea: string;
  dealer: string;
  codalLife: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  lastMovement: string;
  holder?: string;
  holderEmployeeCode?: string;
  description: string;
}

export interface FileCreateInput {
  fileBarcode: string;
  subject: string;
  department: string;
  year: number;
  fileType: FileType;
  recordKind?: RecordKind;
  documentSize?: DocumentSize;
  eOfficeReference?: string;
  shelfId: string;
  position: number;
  pincode: string;
  area: string;
  propertyNo: string;
  propertyArea: string;
  dealer: string;
  codalLife: string;
  description: string;
}

// --------------------------------------------------------- issue and movement

export type IssueStatus = 'Issued' | 'Returned' | 'Overdue' | 'Partially returned';

export interface IssueLine {
  fileId: string;
  fileBarcode: string;
  returnedAt: string | null;
}

/** `issue_file_tbl`, extended to support the legacy multi-file issue flow. */
export interface IssueRecord {
  id: string;
  receiptNumber: string;
  /** Borrower — a registered employee or a walk-in depositor code. */
  borrowerType: 'Employee' | 'Depositor';
  borrowerName: string;
  borrowerEmployeeCode: string;
  department: string;
  purpose: string;
  lines: IssueLine[];
  issuedAt: string;
  dueAt: string;
  returnedAt: string | null;
  status: IssueStatus;
  remark: string;
  issuedBy: string;
  createdAt: string;
}

export type MovementKind =
  'Issue' | 'Return' | 'Location change' | 'Digitization' | 'File created' | 'Relocation';

export interface MovementEvent {
  id: string;
  kind: MovementKind;
  fileId: string;
  fileBarcode: string;
  subject: string;
  from: string;
  to: string;
  actor: string;
  at: string;
  detail: string;
  issueId?: string;
}

// ------------------------------------------------------------------- audit log

export type AuditAction =
  | 'Login'
  | 'Logout'
  | 'Create'
  | 'Update'
  | 'Delete'
  | 'Issue'
  | 'Return'
  | 'Relocate'
  | 'Approve'
  | 'Reject'
  | 'Export';

export interface AuditEntry {
  id: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  actor: string;
  role: Role;
  at: string;
  ip: string;
  before: string;
  after: string;
  summary: string;
}

// -------------------------------------------------------------- digitization

export type DigitizationFolder = 'service_book' | 'leave_report' | 'sr' | 'apar';

export const DIGITIZATION_FOLDERS: DigitizationFolder[] = [
  'service_book',
  'leave_report',
  'sr',
  'apar',
];

export const FOLDER_LABELS: Record<DigitizationFolder, string> = {
  service_book: 'Service book',
  leave_report: 'Leave report',
  sr: 'Service record',
  apar: 'Annual performance appraisal',
};

export type PageStatus = 'Pending review' | 'Approved' | 'Rejected' | 'Duplicate' | 'Active';

export type BatchStatus = 'In progress' | 'Submitted' | 'Approved' | 'Partially approved';

/** `upload_file` — one row per scanned page + version. */
export interface DigitizationPage {
  id: string;
  batchId: string;
  fileBarcode: string;
  filename: string;
  pageNo: number;
  version: number;
  status: PageStatus;
  note: string;
  uploadedAt: string;
  uploadedBy: string;
  bulk: boolean;
}

export interface DigitizationBatch {
  id: string;
  code: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  folder: DigitizationFolder;
  status: BatchStatus;
  pages: DigitizationPage[];
  createdAt: string;
  createdBy: string;
  submittedAt: string | null;
}

/** `upload_map` — scanned room/area maps attached to a file. */
export interface MapUpload {
  id: string;
  fileBarcode: string;
  filename: string;
  pageNo: number;
  version: number;
  status: PageStatus;
  uploadedAt: string;
  uploadedBy: string;
  sizeKb: number;
}

// ------------------------------------------------------------------- barcodes

export type BarcodeSubject = 'File' | 'Shelf' | 'Almirah' | 'Section' | 'Room' | 'Area';

export interface BarcodePayload {
  subject: BarcodeSubject;
  /** Symbology: Code128 for linear labels, QR for scanner-to-URL. */
  symbology: 'Code128' | 'QR';
  value: string;
  label: string;
  meta: string;
  valid: boolean;
  reason?: string;
}

export interface BarcodeJob {
  id: string;
  subject: BarcodeSubject;
  targetId: string;
  label: string;
  symbology: 'Code128' | 'QR';
  value: string;
  quantity: number;
  requestedBy: string;
  createdAt: string;
  status: 'Queued' | 'Printed' | 'Cancelled';
}

export interface ScanResult {
  ok: boolean;
  payload: BarcodePayload | null;
  message: string;
}

// ---------------------------------------------------------------- bulk ingest

export interface BulkImportRow {
  rowNo: number;
  fileBarcode: string;
  subject: string;
  shelfBarcode: string;
  result: 'Accepted' | 'Duplicate barcode' | 'Unknown shelf' | 'Inactive shelf' | 'Invalid row';
  detail: string;
}

export interface BulkImportJob {
  id: string;
  filename: string;
  folder: string;
  createdAt: string;
  createdBy: string;
  status: 'Validated' | 'Committed' | 'Failed';
  rows: BulkImportRow[];
  accepted: number;
  rejected: number;
  duplicates: number;
}

// ------------------------------------------------------------------- reports

export type ReportKey =
  | 'issue-register'
  | 'return-register'
  | 'movement-log'
  | 'file-registry'
  | 'digitization-progress'
  | 'login-history'
  | 'location-occupancy'
  | 'overdue-files';

export interface ReportDefinition {
  key: ReportKey;
  title: string;
  description: string;
  columns: string[];
  legacySource: string;
}

export interface DashboardStats {
  totalRecords: number;
  mappedPercent: number;
  issuedNow: number;
  dueToday: number;
  digitizationPercent: number;
  overdueCount: number;
  roomCount: number;
  activeBorrowers: number;
  pendingApprovals: number;
}

// ------------------------------------------------------------------- timeline

export interface TimelineEvent {
  id: string;
  label: string;
  date: string;
  actor: string;
  detail: string;
  tone: 'default' | 'success' | 'warning' | 'danger';
}

/** Editorial cards used by the masonry knowledge surface. */
export interface GalleryItem {
  id: string;
  title: string;
  text: string;
  height: number;
}
