/**
 * `file_tbl` registry.
 *
 * Validation mirrors legacy `File.php`: `checkfilebarcode` enforces the unique
 * index on `file_barcode`, `checkShelfBarcode` requires the referenced shelf to
 * exist and be active, and `getpincode` resolves the area → pincode lookup.
 */

import { err, ok, type FieldIssue, type FileQuery, type FilesApi } from '../contracts';
import { newId, store, timestamp } from '../store';
import type { FileCreateInput, RecordFile, Room, Section, Shelf, StorageUnit } from '../../types';
import { log } from './audit';
import { locationsService } from './locations';
import { session } from './session';

const MAX_POSITION = 100;
const RF_PREFIX = 'RF-';

function matchSearch(file: RecordFile, needle: string): boolean {
  const haystack = [
    file.fileBarcode,
    file.rfId,
    file.fileNumber,
    file.subject,
    file.department,
    file.location,
    file.holder ?? '',
    file.area,
    file.dealer,
    file.recordKind ?? (file.fileType === 'Map' ? 'Map' : 'File'),
    file.documentSize ?? '',
    file.eOfficeReference ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

function locationPath(
  room: Room | undefined,
  section: Section | undefined,
  unit: StorageUnit | undefined,
  shelf: Shelf | undefined,
) {
  return [room?.code, section?.code, unit?.code, shelf?.code].filter(Boolean).join(' / ');
}

/** Next RF id in the `RF-0000000000` series, based on the highest live value. */
export function nextFileBarcode(existing: RecordFile[]): string {
  const highest = existing.reduce((max, file) => {
    const digits = Number(file.fileBarcode.replace(/\D/g, ''));
    return Number.isFinite(digits) && digits > max ? digits : max;
  }, 1_200_000);
  return `${RF_PREFIX}${String(highest + 1).padStart(10, '0')}`;
}

export const filesService: FilesApi = {
  async list(query: FileQuery = {}) {
    const state = store.getState();
    const search = query.search?.trim().toLowerCase() ?? '';
    const filtered = state.files.filter((file) => {
      if (search && !matchSearch(file, search)) return false;
      if (query.department && query.department !== 'All' && file.department !== query.department) {
        return false;
      }
      if (query.status && query.status !== 'All' && file.status !== query.status) return false;
      const recordKind = file.recordKind ?? (file.fileType === 'Map' ? 'Map' : 'File');
      if (query.recordKind && query.recordKind !== 'All' && recordKind !== query.recordKind) return false;
      if (query.fileType && query.fileType !== 'All' && file.fileType !== query.fileType) return false;
      const hasEOffice = Boolean(file.eOfficeReference?.trim());
      if (query.eOfficeStatus === 'Linked' && !hasEOffice) return false;
      if (query.eOfficeStatus === 'Not linked' && hasEOffice) return false;
      if (query.roomId && file.roomId !== query.roomId) return false;
      if (query.sectionId && file.sectionId !== query.sectionId) return false;
      if (query.shelfId && file.shelfId !== query.shelfId) return false;
      if (query.area && query.area !== 'All' && file.area !== query.area) return false;
      return true;
    });

    const sortKey = query.sort ?? 'fileNumber';
    const direction = query.direction === 'desc' ? -1 : 1;
    filtered.sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      if (typeof left === 'number' && typeof right === 'number') return (left - right) * direction;
      return String(left ?? '').localeCompare(String(right ?? ''), 'en-IN') * direction;
    });

    const pageSize = Math.max(1, query.pageSize ?? 10);
    const page = Math.max(1, query.page ?? 1);
    const start = (page - 1) * pageSize;
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  },

  async get(id) {
    return store.getState().files.find((file) => file.id === id) ?? null;
  },

  async byBarcode(barcode) {
    const needle = barcode.trim().toUpperCase();
    if (!needle) return null;
    return store.getState().files.find((file) => file.fileBarcode.toUpperCase() === needle) ?? null;
  },

  async byShelf(shelfId) {
    return store.getState().files.filter((file) => file.shelfId === shelfId);
  },

  async departments() {
    return [...new Set(store.getState().files.map((file) => file.department))].sort();
  },

  async validateCreate(input: FileCreateInput): Promise<FieldIssue[]> {
    const issues: FieldIssue[] = [];
    const state = store.getState();

    const barcode = input.fileBarcode.trim().toUpperCase();
    if (!barcode) {
      issues.push({
        field: 'fileBarcode',
        message: 'File barcode is required.',
        severity: 'error',
      });
    } else if (!barcode.startsWith(RF_PREFIX)) {
      issues.push({
        field: 'fileBarcode',
        message: `Legacy barcodes start with ${RF_PREFIX}.`,
        severity: 'warning',
      });
    } else if (state.files.some((file) => file.fileBarcode.toUpperCase() === barcode)) {
      issues.push({
        field: 'fileBarcode',
        message: `${barcode} is already registered.`,
        severity: 'error',
      });
    }

    if (!input.subject.trim()) {
      issues.push({ field: 'subject', message: 'Subject is required.', severity: 'error' });
    }
    if (!input.department.trim()) {
      issues.push({ field: 'department', message: 'Department is required.', severity: 'error' });
    }
    if (!Number.isFinite(input.year) || input.year < 1800 || input.year > 2200) {
      issues.push({ field: 'year', message: 'Enter a four-digit year.', severity: 'error' });
    }

    // checkShelfBarcode: the shelf must exist and be usable.
    const shelf = await locationsService.findShelf(input.shelfId);
    if (!shelf) {
      issues.push({ field: 'shelfId', message: 'Select a shelf.', severity: 'error' });
    } else if (shelf.status !== 'Active') {
      issues.push({
        field: 'shelfId',
        message: `${shelf.code} is ${shelf.status.toLowerCase()} and cannot accept new files.`,
        severity: 'error',
      });
    } else if (shelf.occupied >= shelf.capacity) {
      issues.push({
        field: 'shelfId',
        message: `${shelf.code} is full (${shelf.occupied}/${shelf.capacity}).`,
        severity: 'warning',
      });
    }

    if (!Number.isFinite(input.position) || input.position < 1 || input.position > MAX_POSITION) {
      issues.push({
        field: 'position',
        message: `Position must be between 1 and ${MAX_POSITION}.`,
        severity: 'error',
      });
    }

    // getpincode: the area must be a known master area.
    const areaName = input.area.trim();
    if (areaName) {
      const area = state.areas.find((item) => item.name.toLowerCase() === areaName.toLowerCase());
      if (!area) {
        issues.push({
          field: 'area',
          message: `${areaName} is not a known area.`,
          severity: 'error',
        });
      } else if (area.status !== 'Active') {
        issues.push({
          field: 'area',
          message: `${area.name} is inactive in master_area_tbl.`,
          severity: 'warning',
        });
      }
    }

    return issues;
  },

  async create(input: FileCreateInput) {
    const issues = await filesService.validateCreate(input);
    const blocking = issues.filter((issue) => issue.severity === 'error');
    if (blocking.length > 0) {
      return err(blocking[0].message, blocking[0].field);
    }

    const state = store.getState();
    const fileBarcode = input.fileBarcode.trim().toUpperCase();
    const shelf = (await locationsService.findShelf(input.shelfId))!;
    const unit = state.rooms
      .flatMap((room) => room.storageUnits)
      .find((item) => item.id === shelf.almirahId);
    const room = state.rooms.find((item) => item.id === unit?.roomId);
    const section = room?.sections.find((item) => item.id === unit?.sectionId);
    const area = state.areas.find(
      (item) => item.name.toLowerCase() === input.area.trim().toLowerCase(),
    );

    const now = timestamp();
    const file: RecordFile = {
      id: newId('file'),
      fileBarcode,
      rfId: fileBarcode,
      fileNumber: `${input.department.trim().toUpperCase()}/${input.year}/${fileBarcode.slice(-4)}`,
      subject: input.subject.trim(),
      department: input.department.trim(),
      year: input.year,
      fileType: input.fileType,
      recordKind: input.recordKind ?? (input.documentSize === 'A0' ? 'Map' : input.fileType === 'Map' ? 'Map' : 'File'),
      documentSize: input.documentSize ?? 'Other',
      eOfficeReference: input.eOfficeReference?.trim() || undefined,
      status: 'Available',
      location: locationPath(room, section, unit, shelf),
      roomId: room?.id ?? '',
      sectionId: section?.id ?? '',
      section: section?.code ?? '',
      almirahId: unit?.id ?? '',
      almirah: unit?.code ?? '',
      shelfId: shelf.id,
      shelf: shelf.code,
      shelfBarcode: shelf.barcode,
      position: input.position,
      pincode: input.pincode.trim() || area?.pincode || '',
      area: input.area.trim(),
      propertyNo: input.propertyNo.trim(),
      propertyArea: input.propertyArea.trim(),
      dealer: input.dealer.trim(),
      codalLife: input.codalLife.trim(),
      createdAt: now.slice(0, 10),
      createdBy: session.userName(),
      updatedAt: now.slice(0, 10),
      updatedBy: session.userName(),
      lastMovement: now,
      description: input.description.trim(),
    };

    store.update((draft) => {
      draft.files.push(file);
      const targetUnit = draft.rooms
        .flatMap((item) => item.storageUnits)
        .find((item) => item.id === shelf.almirahId);
      const targetShelf = targetUnit?.shelves.find((item) => item.id === shelf.id);
      if (targetShelf) targetShelf.occupied += 1;

      draft.movements.unshift({
        id: newId('mv'),
        kind: 'File created',
        fileId: file.id,
        fileBarcode: file.fileBarcode,
        subject: file.subject,
        from: '—',
        to: file.location,
        actor: session.userName(),
        at: now,
        detail: `Registered on shelf ${shelf.code} (barcode ${shelf.barcode}).`,
      });

      log(draft, {
        action: 'Create',
        entity: 'RecordFile',
        entityId: file.id,
        before: '—',
        after: `${file.fileBarcode} @ ${file.shelf}`,
        summary: `Created ${file.fileNumber} — ${file.subject}`,
      });
    });

    return ok(file);
  },

  async relocate(fileId, shelfId, position, reason) {
    const file = await filesService.get(fileId);
    if (!file) return err('File not found.', 'fileId');
    if (file.status === 'Issued') {
      return err('Return the file before changing its shelf.', 'shelfId');
    }

    const state = store.getState();
    const shelf = await locationsService.findShelf(shelfId);
    if (!shelf) return err('Shelf not found.', 'shelfId');
    if (shelf.status !== 'Active') {
      return err(`${shelf.code} is ${shelf.status.toLowerCase()}.`, 'shelfId');
    }
    if (!Number.isFinite(position) || position < 1 || position > MAX_POSITION) {
      return err(`Position must be between 1 and ${MAX_POSITION}.`, 'position');
    }

    const unit = state.rooms
      .flatMap((room) => room.storageUnits)
      .find((item) => item.id === shelf.almirahId);
    const room = state.rooms.find((item) => item.id === unit?.roomId);
    const section = room?.sections.find((item) => item.id === unit?.sectionId);
    const from = file.location;
    const now = timestamp();

    const updated: RecordFile = {
      ...file,
      location: locationPath(room, section, unit, shelf),
      roomId: room?.id ?? '',
      sectionId: section?.id ?? '',
      section: section?.code ?? '',
      almirahId: unit?.id ?? '',
      almirah: unit?.code ?? '',
      shelfId: shelf.id,
      shelf: shelf.code,
      shelfBarcode: shelf.barcode,
      position,
      updatedAt: now.slice(0, 10),
      updatedBy: session.userName(),
      lastMovement: now,
    };

    store.update((draft) => {
      const index = draft.files.findIndex((item) => item.id === fileId);
      if (index < 0) return;
      draft.files[index] = updated;

      const previousUnit = draft.rooms
        .flatMap((item) => item.storageUnits)
        .find((item) => item.id === file.almirahId);
      const previousShelf = previousUnit?.shelves.find((item) => item.id === file.shelfId);
      if (previousShelf && previousShelf.id !== shelf.id)
        previousShelf.occupied = Math.max(0, previousShelf.occupied - 1);

      const nextUnit = draft.rooms
        .flatMap((item) => item.storageUnits)
        .find((item) => item.id === shelf.almirahId);
      const nextShelf = nextUnit?.shelves.find((item) => item.id === shelf.id);
      if (nextShelf && nextShelf.id !== file.shelfId) nextShelf.occupied += 1;

      draft.movements.unshift({
        id: newId('mv'),
        kind: 'Location change',
        fileId: file.id,
        fileBarcode: file.fileBarcode,
        subject: file.subject,
        from,
        to: updated.location,
        actor: session.userName(),
        at: now,
        detail: reason.trim() || 'Shelf reassigned from the file registry.',
      });

      log(draft, {
        action: 'Relocate',
        entity: 'RecordFile',
        entityId: file.id,
        before: `shelf=${file.shelf}`,
        after: `shelf=${updated.shelf}`,
        summary: `${file.fileBarcode} relocated to ${updated.shelf}`,
      });
    });

    return ok(updated);
  },

  async updateEOfficeReference(fileId, reference) {
    const file = await filesService.get(fileId);
    if (!file) return err('File not found.', 'fileId');

    const previous = file.eOfficeReference?.trim() ?? '';
    const next = reference.trim();
    if (next.length > 200) return err('E-office reference must be 200 characters or fewer.', 'eOfficeReference');
    const updated: RecordFile = {
      ...file,
      eOfficeReference: next || undefined,
      updatedAt: timestamp().slice(0, 10),
      updatedBy: session.userName(),
    };

    store.update((draft) => {
      const index = draft.files.findIndex((item) => item.id === fileId);
      if (index >= 0) draft.files[index] = updated;
      log(draft, {
        action: 'Update',
        entity: 'RecordFile',
        entityId: fileId,
        before: previous || 'Not linked',
        after: next || 'Not linked',
        summary: `Updated e-office reference for ${file.fileBarcode}`,
      });
    });
    return ok(updated);
  },

  async remove(fileId) {
    const file = await filesService.get(fileId);
    if (!file) return err('File not found.', 'fileId');
    if (file.status === 'Issued') {
      return err('This file is issued. Return it before deleting the registry row.', 'fileId');
    }

    store.update((draft) => {
      draft.files = draft.files.filter((item) => item.id !== fileId);
      const unit = draft.rooms
        .flatMap((item) => item.storageUnits)
        .find((item) => item.id === file.almirahId);
      const shelf = unit?.shelves.find((item) => item.id === file.shelfId);
      if (shelf) shelf.occupied = Math.max(0, shelf.occupied - 1);

      log(draft, {
        action: 'Delete',
        entity: 'RecordFile',
        entityId: fileId,
        before: `${file.fileBarcode} @ ${file.shelf}`,
        after: 'deleted',
        summary: `Registry row removed for ${file.fileBarcode}`,
      });
    });
    return ok(true);
  },
};
