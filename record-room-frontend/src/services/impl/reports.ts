/**
 * Report builders.
 *
 * Each definition points at the legacy controller that produced the equivalent
 * export (`User.php: *ExcelFile/*updatereportexcel*`), so the column set stays
 * traceable. The frontend emits CSV now; the .NET 10 reports worker will serve
 * real `.xlsx` from the same definitions.
 */

import { toCsv, downloadCsv, slugify } from '../../lib/csv';
import { FOLDER_LABELS, type ReportDefinition, type ReportKey } from '../../types';
import type { ReportResult, ReportsApi } from '../contracts';
import { store, timestamp } from '../store';
import { log } from './audit';

const definitions: ReportDefinition[] = [
  {
    key: 'issue-register',
    title: 'Issue register',
    description: 'Every receipt with its borrower, purpose, due date and open-file count.',
    columns: [
      'Receipt',
      'Issued at',
      'Borrower',
      'Code',
      'Department',
      'Purpose',
      'Due',
      'Status',
      'Files',
    ],
    legacySource: 'Record.php · issue list',
  },
  {
    key: 'return-register',
    title: 'Return register',
    description: 'Receipts with at least one returned file, including the return timestamp.',
    columns: ['Receipt', 'Borrower', 'Returned at', 'Files returned', 'Open files', 'Status'],
    legacySource: 'Record.php · returnfilelist',
  },
  {
    key: 'movement-log',
    title: 'Movement log',
    description: 'Issue, return, relocation and digitization events in reverse chronology.',
    columns: ['At', 'Kind', 'Barcode', 'Subject', 'From', 'To', 'Actor', 'Detail'],
    legacySource: 'activity_log_tbl projection',
  },
  {
    key: 'file-registry',
    title: 'File registry',
    description: 'Registry master data with shelf barcode, location and status.',
    columns: [
      'Barcode',
      'Number',
      'Subject',
      'Department',
      'Year',
      'Status',
      'Shelf',
      'Shelf barcode',
      'Last movement',
    ],
    legacySource: 'File.php · file listing',
  },
  {
    key: 'digitization-progress',
    title: 'Digitization progress',
    description: 'Batch-level page counts with approval state per batch.',
    columns: [
      'Batch',
      'Employee',
      'Code',
      'Department',
      'Folder',
      'Pages',
      'Approved',
      'Rejected',
      'Pending',
      'Status',
    ],
    legacySource: 'User.php · uploadservice report',
  },
  {
    key: 'login-history',
    title: 'Login history',
    description: 'Web and mobile sign-in attempts with IP, client and outcome.',
    columns: [
      'Login at',
      'Logout at',
      'User',
      'Role',
      'Channel',
      'IP',
      'Client',
      'Outcome',
      'Detail',
    ],
    legacySource: 'User.php · login_history export',
  },
  {
    key: 'location-occupancy',
    title: 'Location occupancy',
    description: 'Shelf-level occupancy for capacity planning and re-shelving.',
    columns: [
      'Room',
      'Section',
      'Almirah',
      'Shelf',
      'Barcode',
      'Status',
      'Occupied',
      'Capacity',
      'Free',
    ],
    legacySource: 'Store.php · shelf listing',
  },
  {
    key: 'overdue-files',
    title: 'Overdue files',
    description: 'Open receipts past their due date, with the oldest due first.',
    columns: [
      'Receipt',
      'Borrower',
      'Code',
      'Department',
      'Due',
      'Days late',
      'Open files',
      'Issued by',
    ],
    legacySource: 'Employee_reports.php · borrow_list',
  },
];

function daysLate(dueAt: string): number {
  const ms = Date.now() - new Date(dueAt).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export const reportsService: ReportsApi = {
  definitions,

  build(key: ReportKey): ReportResult {
    const definition = definitions.find((item) => item.key === key);
    if (!definition) throw new Error(`Unknown report "${key}".`);
    const state = store.getState();
    let rows: Array<Array<string | number>> = [];

    switch (key) {
      case 'issue-register':
        rows = state.issues.map((issue) => [
          issue.receiptNumber,
          issue.issuedAt,
          issue.borrowerName,
          issue.borrowerEmployeeCode,
          issue.department,
          issue.purpose,
          issue.dueAt,
          issue.status,
          issue.lines.filter((line) => !line.returnedAt).length,
        ]);
        break;
      case 'return-register':
        rows = state.issues
          .filter((issue) => issue.lines.some((line) => line.returnedAt))
          .map((issue) => [
            issue.receiptNumber,
            issue.borrowerName,
            issue.returnedAt ?? 'partial',
            issue.lines.filter((line) => line.returnedAt).length,
            issue.lines.filter((line) => !line.returnedAt).length,
            issue.status,
          ]);
        break;
      case 'movement-log':
        rows = [...state.movements]
          .sort((a, b) => b.at.localeCompare(a.at))
          .map((event) => [
            event.at,
            event.kind,
            event.fileBarcode,
            event.subject,
            event.from,
            event.to,
            event.actor,
            event.detail,
          ]);
        break;
      case 'file-registry':
        rows = [...state.files]
          .sort((a, b) => a.fileBarcode.localeCompare(b.fileBarcode))
          .map((file) => [
            file.fileBarcode,
            file.fileNumber,
            file.subject,
            file.department,
            file.year,
            file.status,
            file.shelf,
            file.shelfBarcode,
            file.lastMovement,
          ]);
        break;
      case 'digitization-progress':
        rows = state.batches.map((batch) => [
          batch.code,
          batch.employeeName,
          batch.employeeCode,
          batch.department,
          FOLDER_LABELS[batch.folder],
          batch.pages.length,
          batch.pages.filter((page) => page.status === 'Approved').length,
          batch.pages.filter((page) => page.status === 'Rejected').length,
          batch.pages.filter((page) => page.status === 'Pending review').length,
          batch.status,
        ]);
        break;
      case 'login-history':
        rows = state.loginHistory
          .slice()
          .sort((a, b) => b.loginAt.localeCompare(a.loginAt))
          .map((entry) => [
            entry.loginAt,
            entry.logoutAt ?? '—',
            entry.userName,
            entry.role,
            entry.channel,
            entry.ip,
            entry.userAgent,
            entry.outcome,
            entry.detail,
          ]);
        break;
      case 'location-occupancy':
        state.rooms.forEach((room) => {
          room.storageUnits.forEach((unit) => {
            const section = room.sections.find((item) => item.id === unit.sectionId);
            unit.shelves.forEach((shelf) => {
              rows.push([
                room.code,
                section?.name ?? '',
                unit.code,
                shelf.code,
                shelf.barcode,
                shelf.status,
                shelf.occupied,
                shelf.capacity,
                Math.max(0, shelf.capacity - shelf.occupied),
              ]);
            });
          });
        });
        break;
      case 'overdue-files':
        rows = state.issues
          .filter((issue) => issue.status === 'Overdue')
          .map((issue) => [
            issue.receiptNumber,
            issue.borrowerName,
            issue.borrowerEmployeeCode,
            issue.department,
            issue.dueAt,
            daysLate(issue.dueAt),
            issue.lines.filter((line) => !line.returnedAt).length,
            issue.issuedBy,
          ]);
        break;
    }

    return { definition, columns: definition.columns, rows, generatedAt: timestamp() };
  },
};

/** CSV export that also writes the export itself to the audit trail. */
export function exportReport(key: ReportKey): ReportResult {
  const result = reportsService.build(key);
  const csv = toCsv(result.columns, result.rows);
  downloadCsv(`${slugify(result.definition.title)}-${result.generatedAt.slice(0, 10)}.csv`, csv);
  store.update((draft) => {
    log(draft, {
      action: 'Export',
      entity: 'Report',
      entityId: key,
      before: 'format=csv',
      after: `rows=${result.rows.length}`,
      summary: `${result.definition.title} exported (${result.rows.length} rows)`,
    });
  });
  return result;
}

export type { ReportDefinition, ReportKey };
