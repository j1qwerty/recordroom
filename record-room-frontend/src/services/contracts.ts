/**
 * Service contracts.
 *
 * These interfaces are the frontend's view of the future .NET 10 API. The
 * in-memory implementation under `./impl/` satisfies them today; an HTTP
 * adapter will satisfy the same interfaces against `dotnet-api/` without any
 * page changing.
 */

import type {
  AppUser,
  Area,
  AuditAction,
  AuditEntry,
  BarcodeJob,
  BarcodePayload,
  BarcodeSubject,
  BulkImportJob,
  DashboardStats,
  DigitizationBatch,
  DigitizationFolder,
  DigitizationPage,
  Employee,
  FileCreateInput,
  FileStatus,
  IssueRecord,
  LoginHistoryEntry,
  MapUpload,
  MovementEvent,
  MovementKind,
  RecordFile,
  ReportDefinition,
  ReportKey,
  Role,
  Room,
  ScanResult,
  Section,
  Shelf,
  StorageStatus,
  StorageUnit,
  TimelineEvent,
} from '../types';
import type {
  InquiryPayload,
  InquiryRecord,
  MediaLinkPayload,
  MediaLinkRecord,
} from './impl/inquiries';

export type Result<T> = { ok: true; value: T } | { ok: false; error: string; field?: string };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <T = never>(error: string, field?: string): Result<T> => ({
  ok: false,
  error,
  field,
});

export interface Page<T> {
  items: T[];
  /** Total rows in the underlying collection, not just the loaded page. */
  total: number;
  page: number;
  pageSize: number;
}

export interface FieldIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// ------------------------------------------------------------------ auth api

export interface OtpChallenge {
  id: string;
  otp: string;
  expiresAt: string;
}

export interface LoginResult {
  user: AppUser;
  /** Demo-only: the generated OTP, surfaced so the mock flow can complete. */
  challenge?: OtpChallenge;
}

export interface AuthApi {
  signIn(userName: string, password: string): Result<AppUser>;
  requestOtp(userName: string): Result<OtpChallenge>;
  signInWithOtp(userName: string, otp: string): Result<AppUser>;
  signInWithPin(userName: string, pin: string): Result<AppUser>;
  requestRecovery(userName: string): Result<{ otp: string }>;
  recoverPassword(userName: string, otp: string, password: string): Result<AppUser>;
  signOut(): void;
  currentUser(): AppUser | null;
  setCurrentUser(user: AppUser | null): void;
  demoPassword: string;
}

// --------------------------------------------------------------- location api

export interface SectionInput {
  name: string;
  status?: StorageStatus;
}

export interface AlmirahInput {
  code: string;
  name: string;
  type?: StorageUnit['type'];
  barcode?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ShelfInput {
  code: string;
  name: string;
  barcode: string;
  capacity?: number;
  status?: StorageStatus;
}

export interface LocationsApi {
  listRooms(): Room[];
  room(id: string): Room | null;
  sectionsOf(roomId: string): Section[];
  unitsOf(sectionId: string): StorageUnit[];
  shelvesOf(almirahId: string): Shelf[];
  findShelf(id: string): Shelf | null;
  findShelfByBarcode(barcode: string): Shelf | null;
  addSection(roomId: string, input: SectionInput): Result<Section>;
  updateSection(sectionId: string, input: Partial<SectionInput>): Result<Section>;
  deleteSection(sectionId: string): Result<true>;
  addAlmirah(sectionId: string, input: AlmirahInput): Result<StorageUnit>;
  updateAlmirah(almirahId: string, input: Partial<AlmirahInput>): Result<StorageUnit>;
  deleteAlmirah(almirahId: string): Result<true>;
  addShelf(almirahId: string, input: ShelfInput): Result<Shelf>;
  updateShelf(shelfId: string, input: Partial<ShelfInput>): Result<Shelf>;
  deleteShelf(shelfId: string): Result<true>;
  setUnitStatus(almirahId: string, status: StorageStatus): Result<StorageUnit>;
  /** Bumps the persisted layout revision for a room and records the change. */
  saveLayout(roomId: string, note: string): Result<{ revision: number }>;
  layoutRevisions(
    roomId: string,
  ): Array<{ revision: number; note: string; at: string; actor: string }>;
  occupancy(): Array<{
    room: Room;
    sections: Array<{ section: Section; almirahs: number; shelves: number; capacity: number }>;
  }>;
  areas(): Area[];
}

// ------------------------------------------------------------------ files api

export interface FileQuery {
  search?: string;
  department?: string;
  status?: FileStatus | 'All';
  roomId?: string;
  sectionId?: string;
  shelfId?: string;
  area?: string;
  sort?: keyof RecordFile;
  direction?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface FilesApi {
  list(query?: FileQuery): Page<RecordFile>;
  get(id: string): RecordFile | null;
  byBarcode(barcode: string): RecordFile | null;
  byShelf(shelfId: string): RecordFile[];
  departments(): string[];
  validateCreate(input: FileCreateInput): FieldIssue[];
  create(input: FileCreateInput): Result<RecordFile>;
  relocate(fileId: string, shelfId: string, position: number, reason: string): Result<RecordFile>;
  remove(fileId: string): Result<true>;
}

// --------------------------------------------------------------- issue api

export interface IssueInput {
  borrowerType: 'Employee' | 'Depositor';
  borrowerEmployeeCode: string;
  borrowerName: string;
  department: string;
  purpose: string;
  fileIds: string[];
  dueAt: string;
  remark: string;
}

export interface IssueQuery {
  status?: IssueRecord['status'] | 'All';
  borrower?: string;
  open?: boolean;
  page?: number;
  pageSize?: number;
}

export interface BorrowerRow {
  employeeCode: string;
  name: string;
  department: string;
  openFiles: number;
  oldestDue: string;
  overdue: boolean;
}

export interface IssueApi {
  list(query?: IssueQuery): Page<IssueRecord>;
  get(id: string): IssueRecord | null;
  borrowers(): BorrowerRow[];
  /** Guards: every file must exist and be Available; no duplicates. */
  issueFiles(input: IssueInput): Result<IssueRecord>;
  returnFiles(issueId: string, fileIds: string[], condition: string): Result<IssueRecord>;
  overdue(): IssueRecord[];
  nextReceiptNumber(): string;
}

// ------------------------------------------------------------ movement api

export interface MovementQuery {
  kind?: MovementKind | 'All';
  fileId?: string;
  search?: string;
  limit?: number;
}

export interface MovementApi {
  list(query?: MovementQuery): MovementEvent[];
  recent(limit?: number): MovementEvent[];
}

// ---------------------------------------------------------------- employee api

export interface EmployeeQuery {
  search?: string;
  department?: string;
  status?: Employee['status'] | 'All';
  page?: number;
  pageSize?: number;
}

export interface EmployeesApi {
  list(query?: EmployeeQuery): Page<Employee>;
  get(id: string): Employee | null;
  byCode(code: string): Employee | null;
  create(input: Omit<Employee, 'id' | 'createdAt' | 'modifiedAt' | 'status'>): Result<Employee>;
  update(id: string, input: Partial<Employee>): Result<Employee>;
  remove(id: string): Result<true>;
  departments(): string[];
}

// ---------------------------------------------------------- digitization api

export interface DigitizationQuery {
  employeeCode?: string;
  folder?: DigitizationFolder | 'All';
  status?: DigitizationBatch['status'] | 'All';
  search?: string;
}

export interface DigitizationApi {
  batches(query?: DigitizationQuery): DigitizationBatch[];
  batch(id: string): DigitizationBatch | null;
  createBatch(input: {
    employeeCode: string;
    folder: DigitizationFolder;
    note: string;
  }): Result<DigitizationBatch>;
  /** Legacy per-employee folder: `uploads/<empcode>/<folder>/`. */
  folderPath(batch: DigitizationBatch): string;
  /** Rejects a repeated `fileBarcode` + `pageNo`; bumps `version` on rescan. */
  uploadPage(
    batchId: string,
    input: { fileBarcode: string; pageNo: number; filename: string; bulk: boolean },
  ): Result<DigitizationPage>;
  removePage(pageId: string): Result<true>;
  reviewPage(
    pageId: string,
    decision: 'Approved' | 'Rejected',
    note: string,
  ): Result<DigitizationPage>;
  reviewBatch(
    batchId: string,
    decision: 'Approved' | 'Rejected',
    note: string,
  ): Result<DigitizationBatch>;
  pendingReviewCount(): number;
}

// ----------------------------------------------------------------- upload map

export interface UploadsApi {
  maps(query?: { fileBarcode?: string; search?: string }): MapUpload[];
  addMap(input: {
    fileBarcode: string;
    pageNo: number;
    filename: string;
    sizeKb: number;
  }): Result<MapUpload>;
  removeMap(id: string): Result<true>;
}

// ----------------------------------------------------------------- bulk api

export interface BulkApi {
  jobs(): BulkImportJob[];
  /** Validates a pasted CSV against the registry without committing it. */
  validateCsv(csv: string, folder: string): Result<BulkImportJob>;
  commit(jobId: string): Result<BulkImportJob>;
  job(id: string): BulkImportJob | null;
}

// ----------------------------------------------------------------- audit api

export interface AuditQuery {
  action?: AuditAction | 'All';
  actor?: string;
  entity?: string;
  search?: string;
  limit?: number;
}

export interface AuditApi {
  list(query?: AuditQuery): AuditEntry[];
  loginHistory(query?: {
    outcome?: LoginHistoryEntry['outcome'] | 'All';
    search?: string;
  }): LoginHistoryEntry[];
  actors(): string[];
}

// ---------------------------------------------------------------- report api

export interface ReportResult {
  definition: ReportDefinition;
  columns: string[];
  rows: Array<Array<string | number>>;
  generatedAt: string;
}

export interface ReportsApi {
  definitions: ReportDefinition[];
  build(key: ReportKey): ReportResult;
}

// -------------------------------------------------------------- barcode api

export interface BarcodeApi {
  subjects: BarcodeSubject[];
  payloadFor(subject: BarcodeSubject, id: string): BarcodePayload | null;
  validate(raw: string): ScanResult;
  jobs(): BarcodeJob[];
  createJob(input: {
    subject: BarcodeSubject;
    targetId: string;
    quantity: number;
  }): Result<BarcodeJob>;
  cancelJob(id: string): Result<true>;
}

// ------------------------------------------------------------- dashboard api

export interface DashboardApi {
  stats(): DashboardStats;
  activity(limit?: number): TimelineEvent[];
}

// ---------------------------------------------------------------- users api

export interface UsersApi {
  list(): AppUser[];
  create(input: Omit<AppUser, 'id' | 'lastLoginAt'>): Result<AppUser>;
  update(id: string, input: Partial<AppUser>): Result<AppUser>;
  remove(id: string): Result<true>;
  roles(): Role[];
}

// ------------------------------------------------------ inquiries and media

export interface InquiriesApi {
  save(payload: InquiryPayload): Result<InquiryRecord>;
  list(): InquiryRecord[];
  remove(id: string): Result<true>;
  submittedBy(): string;
}

export interface MediaApi {
  saveLink(payload: MediaLinkPayload): Result<MediaLinkRecord>;
  list(): MediaLinkRecord[];
  remove(id: string): Result<true>;
}

// --------------------------------------------------------------- root facade

export interface RecordRoomService {
  auth: AuthApi;
  locations: LocationsApi;
  files: FilesApi;
  issues: IssueApi;
  movements: MovementApi;
  employees: EmployeesApi;
  digitization: DigitizationApi;
  uploads: UploadsApi;
  bulk: BulkApi;
  audit: AuditApi;
  reports: ReportsApi;
  barcodes: BarcodeApi;
  dashboard: DashboardApi;
  users: UsersApi;
  inquiries: InquiriesApi;
  media: MediaApi;
  /** Drops the local snapshot and reloads the seed dataset. */
  reset(): void;
}
