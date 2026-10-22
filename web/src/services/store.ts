/**
 * Client-side store that stands in for the planned .NET 10 + SQLite API.
 *
 * The store owns a single serialisable snapshot, persists it to
 * `localStorage`, and notifies subscribers after every mutation. The
 * repository in `./repository.ts` is the only module allowed to mutate it, so
 * replacing this file with HTTP calls is a contained change.
 */

import {
  areas,
  auditLog,
  barcodeJobs,
  bulkImportJobs,
  digitizationBatches,
  employees,
  files,
  issues,
  loginHistory,
  mapUploads,
  movements,
  rooms,
  users,
} from '../data/mock';
import type {
  AppUser,
  Area,
  AuditEntry,
  BarcodeJob,
  BulkImportJob,
  DigitizationBatch,
  Employee,
  IssueRecord,
  LoginHistoryEntry,
  MapUpload,
  MovementEvent,
  RecordFile,
  Room,
} from '../types';
import type { InquiryRecord, MediaLinkRecord } from './impl/inquiries';

/** Persisted layout change history for the location designer. */
export interface LayoutRevision {
  roomId: string;
  revision: number;
  note: string;
  at: string;
  actor: string;
}

export interface DbShape {
  areas: Area[];
  rooms: Room[];
  layoutRevisions: LayoutRevision[];
  files: RecordFile[];
  employees: Employee[];
  users: AppUser[];
  loginHistory: LoginHistoryEntry[];
  issues: IssueRecord[];
  movements: MovementEvent[];
  audit: AuditEntry[];
  batches: DigitizationBatch[];
  maps: MapUpload[];
  barcodeJobs: BarcodeJob[];
  bulkJobs: BulkImportJob[];
  inquiries: InquiryRecord[];
  mediaLinks: MediaLinkRecord[];
}

const STORAGE_KEY = 'rr-db-v1';

export function createSeed(): DbShape {
  return {
    areas: structuredClone(areas),
    rooms: structuredClone(rooms),
    layoutRevisions: [],
    files: structuredClone(files),
    employees: structuredClone(employees),
    users: structuredClone(users),
    loginHistory: structuredClone(loginHistory),
    issues: structuredClone(issues),
    movements: structuredClone(movements),
    audit: structuredClone(auditLog),
    batches: structuredClone(digitizationBatches),
    maps: structuredClone(mapUploads),
    barcodeJobs: structuredClone(barcodeJobs),
    bulkJobs: structuredClone(bulkImportJobs),
    inquiries: [],
    mediaLinks: [],
  };
}

function isDbShape(value: unknown): value is DbShape {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<DbShape>;
  return (
    Array.isArray(candidate.rooms) &&
    Array.isArray(candidate.layoutRevisions) &&
    Array.isArray(candidate.files) &&
    Array.isArray(candidate.employees) &&
    Array.isArray(candidate.users) &&
    Array.isArray(candidate.issues) &&
    Array.isArray(candidate.audit) &&
    Array.isArray(candidate.inquiries) &&
    Array.isArray(candidate.mediaLinks)
  );
}

type Listener = () => void;

class Store {
  private snapshot: DbShape;
  private listeners = new Set<Listener>();
  private storageAvailable: boolean;

  constructor() {
    this.storageAvailable = typeof localStorage !== 'undefined';
    this.snapshot = this.read();
  }

  private read(): DbShape {
    if (!this.storageAvailable) return createSeed();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createSeed();
      const parsed: unknown = JSON.parse(raw);
      return isDbShape(parsed) ? parsed : createSeed();
    } catch {
      return createSeed();
    }
  }

  private write() {
    if (!this.storageAvailable) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot));
    } catch {
      // Quota or private-mode failure: keep the in-memory snapshot usable.
    }
  }

  getState = (): DbShape => this.snapshot;

  /**
   * Applies a mutation to a draft copy and publishes the result. The updater
   * must be pure with respect to the snapshot so React sees new identities.
   */
  update = (updater: (draft: DbShape) => void): DbShape => {
    const draft = structuredClone(this.snapshot);
    updater(draft);
    this.snapshot = draft;
    this.write();
    this.listeners.forEach((listener) => listener());
    return draft;
  };

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  reset = () => {
    this.snapshot = createSeed();
    this.write();
    this.listeners.forEach((listener) => listener());
  };
}

export const store = new Store();

let sequence = 0;

/** Monotonic, collision-resistant id used for every new row. */
export function newId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}${sequence.toString(36)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** `YYYY-MM-DD HH:mm` — the format every legacy timestamp column uses. */
export function timestamp(offsetMinutes = 0): string {
  const d = new Date();
  if (offsetMinutes) d.setMinutes(d.getMinutes() + offsetMinutes);
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

export function dateOnly(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
