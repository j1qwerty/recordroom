/**
 * Bulk registry ingest — the legacy `bulk_upload` / `renaming_process` flow.
 *
 * The legacy app staged renamed files under `bulk/Temp00432/` folders and
 * committed them after a duplicate check. Here a pasted CSV is validated
 * against the registry and shelf barcodes first, and every rejected row is
 * reported back so an operator can reconcile instead of editing blindly.
 */

import { err, ok, type BulkApi } from '../contracts';
import { newId, store, timestamp } from '../store';
import type { BulkImportJob, BulkImportRow, RecordFile } from '../../types';
import { log } from './audit';
import { locationsService } from './locations';
import { session } from './session';

const HEADER_ALIASES: Record<string, keyof BulkImportRow> = {
  barcode: 'fileBarcode',
  file_barcode: 'fileBarcode',
  rfid: 'fileBarcode',
  subject: 'subject',
  file_name: 'subject',
  shelf: 'shelfBarcode',
  shelf_barcode: 'shelfBarcode',
};

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else quoted = false;
      } else current += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ',') {
      cells.push(current.trim());
      current = '';
    } else current += char;
  }
  cells.push(current.trim());
  return cells;
}

function classify(
  row: BulkImportRow,
  existing: RecordFile[],
  knownShelves: Set<string>,
  activeShelves: Set<string>,
): void {
  const barcode = row.fileBarcode.trim().toUpperCase();
  const shelfBarcode = row.shelfBarcode.trim().toUpperCase();

  if (!barcode || !row.subject.trim()) {
    row.result = 'Invalid row';
    row.detail = 'Barcode and subject are both required.';
    return;
  }
  if (existing.some((file) => file.fileBarcode.toUpperCase() === barcode)) {
    row.result = 'Duplicate barcode';
    row.detail = `${barcode} already exists in the registry.`;
    return;
  }
  if (!knownShelves.has(shelfBarcode)) {
    row.result = 'Unknown shelf';
    row.detail = `No shelf_tbl row carries barcode ${shelfBarcode}.`;
    return;
  }
  if (!activeShelves.has(shelfBarcode)) {
    row.result = 'Inactive shelf';
    row.detail = `${shelfBarcode} is not active and cannot accept files.`;
    return;
  }
  row.result = 'Accepted';
  row.detail = 'Barcode is free and the target shelf is active.';
}

function tally(rows: BulkImportRow[]) {
  return {
    accepted: rows.filter((row) => row.result === 'Accepted').length,
    rejected: rows.filter((row) => row.result !== 'Accepted').length,
    duplicates: rows.filter((row) => row.result === 'Duplicate barcode').length,
  };
}

export const bulkService: BulkApi = {
  jobs() {
    return [...store.getState().bulkJobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  job(id) {
    return store.getState().bulkJobs.find((job) => job.id === id) ?? null;
  },

  validateCsv(csv, folder) {
    const lines = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      return err('Paste a header row plus at least one data row.', 'csv');
    }

    const header = splitCsvLine(lines[0]).map((cell) => cell.toLowerCase().replace(/[\s-]/g, '_'));
    const mapped = header.map((cell) => HEADER_ALIASES[cell]);
    const barcodeIndex = mapped.indexOf('fileBarcode');
    const subjectIndex = mapped.indexOf('subject');
    const shelfIndex = mapped.indexOf('shelfBarcode');
    if (barcodeIndex < 0 || subjectIndex < 0 || shelfIndex < 0) {
      return err(
        'Header must include barcode (or file_barcode), subject and shelf (or shelf_barcode).',
        'csv',
      );
    }

    const state = store.getState();
    const knownShelves = new Set<string>();
    const activeShelves = new Set<string>();
    state.rooms.forEach((room) => {
      room.storageUnits.forEach((unit) => {
        unit.shelves.forEach((shelf) => {
          knownShelves.add(shelf.barcode.toUpperCase());
          if (shelf.status === 'Active') activeShelves.add(shelf.barcode.toUpperCase());
        });
      });
    });

    const rows: BulkImportRow[] = lines.slice(1).map((line, index) => {
      const cells = splitCsvLine(line);
      const row: BulkImportRow = {
        rowNo: index + 2,
        fileBarcode: cells[barcodeIndex] ?? '',
        subject: cells[subjectIndex] ?? '',
        shelfBarcode: cells[shelfIndex] ?? '',
        result: 'Invalid row',
        detail: '',
      };
      classify(row, state.files, knownShelves, activeShelves);
      return row;
    });

    const job: BulkImportJob = {
      id: newId('bulk'),
      filename: folder.split('/').filter(Boolean).pop() ?? `staged-${Date.now()}.csv`,
      folder,
      createdAt: timestamp(),
      createdBy: session.userName(),
      status: 'Validated',
      rows,
      ...tally(rows),
    };

    store.update((draft) => {
      draft.bulkJobs.unshift(job);
      log(draft, {
        action: 'Create',
        entity: 'BulkImportJob',
        entityId: job.id,
        before: '—',
        after: `accepted=${job.accepted}, rejected=${job.rejected}`,
        summary: `Validated ${rows.length} staged row(s) from ${job.filename}`,
      });
    });
    return ok(job);
  },

  commit(jobId) {
    const job = bulkService.job(jobId);
    if (!job) return err('Import job not found.', 'jobId');
    if (job.status === 'Committed') return err('This job was already committed.', 'jobId');
    if (job.accepted === 0) return err('Nothing to commit: every row was rejected.', 'jobId');

    store.update((draft) => {
      const now = timestamp();
      job.rows
        .filter((row) => row.result === 'Accepted')
        .forEach((row) => {
          const shelf = locationsService.findShelfByBarcode(row.shelfBarcode);
          if (!shelf) {
            row.result = 'Unknown shelf';
            row.detail = 'Shelf disappeared between validation and commit.';
            return;
          }
          const unit = draft.rooms
            .flatMap((item) => item.storageUnits)
            .find((item) => item.id === shelf.almirahId);
          const room = draft.rooms.find((item) => item.id === unit?.roomId);
          const section = room?.sections.find((item) => item.id === unit?.sectionId);
          const barcode = row.fileBarcode.trim().toUpperCase();

          draft.files.push({
            id: newId('file'),
            fileBarcode: barcode,
            rfId: barcode,
            fileNumber: `BULK/${new Date().getFullYear()}/${barcode.slice(-4)}`,
            subject: row.subject.trim(),
            department: 'Unverified',
            year: new Date().getFullYear(),
            fileType: 'File',
            status: 'Available',
            location: [room?.code, section?.code, unit?.code, shelf.code]
              .filter(Boolean)
              .join(' / '),
            roomId: room?.id ?? '',
            sectionId: section?.id ?? '',
            section: section?.code ?? '',
            almirahId: unit?.id ?? '',
            almirah: unit?.code ?? '',
            shelfId: shelf.id,
            shelf: shelf.code,
            shelfBarcode: shelf.barcode,
            position: Math.min(100, shelf.occupied + 1),
            pincode: '',
            area: '',
            propertyNo: '',
            propertyArea: '',
            dealer: '',
            codalLife: 'As per department rules',
            createdAt: now.slice(0, 10),
            createdBy: session.userName(),
            updatedAt: now.slice(0, 10),
            updatedBy: session.userName(),
            lastMovement: now,
            description: 'Created by bulk import; department and area need verification.',
          });

          const targetShelf = draft.rooms
            .flatMap((item) => item.storageUnits)
            .find((item) => item.id === shelf.almirahId)
            ?.shelves.find((item) => item.id === shelf.id);
          if (targetShelf) targetShelf.occupied += 1;

          draft.movements.unshift({
            id: newId('mv'),
            kind: 'File created',
            fileId: barcode,
            fileBarcode: barcode,
            subject: row.subject.trim(),
            from: 'bulk staging',
            to: shelf.code,
            actor: session.userName(),
            at: now,
            detail: `Committed from ${job.filename} row ${row.rowNo}.`,
          });
        });

      const target = draft.bulkJobs.find((item) => item.id === jobId);
      if (target) {
        target.rows = job.rows.map((row) => ({ ...row }));
        target.status = 'Committed';
        Object.assign(target, tally(target.rows));
      }

      log(draft, {
        action: 'Create',
        entity: 'BulkImportJob',
        entityId: jobId,
        before: `status=Validated, accepted=${job.accepted}`,
        after: `status=Committed, accepted=${job.accepted}`,
        summary: `Committed ${job.accepted} row(s) from ${job.filename}`,
      });
    });

    return ok(bulkService.job(jobId)!);
  },
};
