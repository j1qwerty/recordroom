/**
 * `issue_file_tbl` with the legacy multi-file flow.
 *
 * `Record.php: multipleFileIssue/savemultipleissuefile/borrow_list/
 * returnfilelist` issues several files against one requisition and keeps a
 * borrower list. `IssueLine` replaces the legacy one-row-per-file shape so a
 * single receipt can be returned in parts, which is what the old schema could
 * not express.
 */

import {
  err,
  ok,
  type BorrowerRow,
  type IssueApi,
  type IssueInput,
  type IssueQuery,
} from '../contracts';
import { newId, store, timestamp } from '../store';
import type { IssueRecord, IssueStatus, RecordFile } from '../../types';
import { log } from './audit';
import { filesService } from './files';
import { session } from './session';

const isOpen = (issue: IssueRecord) => issue.status !== 'Returned';

function deriveStatus(issue: IssueRecord, now = new Date()): IssueStatus {
  const openLines = issue.lines.filter((line) => line.returnedAt === null);
  if (openLines.length === 0) return 'Returned';
  if (openLines.length < issue.lines.length) return 'Partially returned';
  return new Date(issue.dueAt) < now ? 'Overdue' : 'Issued';
}

function borrowerLabel(issue: IssueRecord): string {
  return issue.borrowerType === 'Employee'
    ? `${issue.borrowerName} · ${issue.department}`
    : `${issue.borrowerName} (depositor ${issue.borrowerEmployeeCode})`;
}

export const issuesService: IssueApi = {
  list(query: IssueQuery = {}) {
    const state = store.getState();
    const search = query.borrower?.trim().toLowerCase() ?? '';
    const filtered = state.issues.filter((issue) => {
      if (query.status && query.status !== 'All' && issue.status !== query.status) return false;
      if (query.open && !isOpen(issue)) return false;
      if (search) {
        const haystack =
          `${issue.borrowerName} ${issue.borrowerEmployeeCode} ${issue.receiptNumber} ${issue.purpose}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
    filtered.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
    const pageSize = Math.max(1, query.pageSize ?? 10);
    const page = Math.max(1, query.page ?? 1);
    return {
      items: filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  },

  get(id) {
    return store.getState().issues.find((issue) => issue.id === id) ?? null;
  },

  borrowers(): BorrowerRow[] {
    const rows: BorrowerRow[] = [];
    store
      .getState()
      .issues.filter(isOpen)
      .forEach((issue) => {
        const openLines = issue.lines.filter((line) => line.returnedAt === null);
        if (openLines.length === 0) return;
        const existing = rows.find((row) => row.employeeCode === issue.borrowerEmployeeCode);
        if (existing) {
          existing.openFiles += openLines.length;
          if (issue.dueAt < existing.oldestDue) existing.oldestDue = issue.dueAt;
          existing.overdue = existing.overdue || issue.status === 'Overdue';
          return;
        }
        rows.push({
          employeeCode: issue.borrowerEmployeeCode,
          name: issue.borrowerName,
          department: issue.department,
          openFiles: openLines.length,
          oldestDue: issue.dueAt,
          overdue: issue.status === 'Overdue',
        });
      });
    return rows.sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      return a.oldestDue.localeCompare(b.oldestDue);
    });
  },

  issueFiles(input: IssueInput) {
    if (input.fileIds.length === 0) {
      return err('Scan at least one file before issuing.', 'fileIds');
    }
    const duplicateScan = input.fileIds.filter((id, index) => input.fileIds.indexOf(id) !== index);
    if (duplicateScan.length > 0) {
      return err('The same file was scanned twice in one receipt.', 'fileIds');
    }
    if (input.borrowerType === 'Employee' && !input.borrowerEmployeeCode.trim()) {
      return err('Select the employee receiving the files.', 'borrowerEmployeeCode');
    }
    if (input.borrowerType === 'Depositor' && !input.borrowerEmployeeCode.trim()) {
      return err('Enter the depositor code for a walk-in borrower.', 'borrowerEmployeeCode');
    }
    if (!input.dueAt) return err('Set a due date for the receipt.', 'dueAt');

    const targets = input.fileIds.map((id) => filesService.get(id));
    const missing = targets.findIndex((file) => file === null);
    if (missing >= 0) return err('One of the scanned files is not in the registry.', 'fileIds');

    const present = targets as RecordFile[];
    const blocked = present.filter((file) => file.status !== 'Available');
    if (blocked.length > 0) {
      return err(
        `${blocked[0].fileBarcode} is ${blocked[0].status.toLowerCase()} and cannot be issued.`,
        'fileIds',
      );
    }

    const now = timestamp();
    const record: IssueRecord = {
      id: newId('issue'),
      receiptNumber: issuesService.nextReceiptNumber(),
      borrowerType: input.borrowerType,
      borrowerName: input.borrowerName.trim() || input.borrowerEmployeeCode.trim(),
      borrowerEmployeeCode: input.borrowerEmployeeCode.trim(),
      department: input.department.trim(),
      purpose: input.purpose.trim(),
      lines: present.map((file) => ({
        fileId: file.id,
        fileBarcode: file.fileBarcode,
        returnedAt: null,
      })),
      issuedAt: now,
      dueAt: input.dueAt,
      returnedAt: null,
      status: 'Issued',
      remark: input.remark.trim(),
      issuedBy: session.userName(),
      createdAt: now,
    };
    // An issue recorded against a past due date is overdue from the start.
    if (new Date(record.dueAt).getTime() < Date.now()) record.status = 'Overdue';

    store.update((draft) => {
      draft.issues.unshift(record);
      present.forEach((file) => {
        const index = draft.files.findIndex((item) => item.id === file.id);
        if (index < 0) return;
        draft.files[index] = {
          ...draft.files[index],
          status: 'Issued',
          holder: borrowerLabel(record),
          holderEmployeeCode: record.borrowerEmployeeCode,
          lastMovement: now,
          updatedAt: now.slice(0, 10),
          updatedBy: session.userName(),
        };
        draft.movements.unshift({
          id: newId('mv'),
          kind: 'Issue',
          fileId: file.id,
          fileBarcode: file.fileBarcode,
          subject: file.subject,
          from: file.location,
          to: borrowerLabel(record),
          actor: session.userName(),
          at: now,
          detail: `Issued on receipt ${record.receiptNumber} (${present.length} file(s)).`,
          issueId: record.id,
        });
      });

      log(draft, {
        action: 'Issue',
        entity: 'IssueRecord',
        entityId: record.id,
        before: 'status=Available',
        after: `status=Issued, files=${present.length}`,
        summary: `Issued ${present.length} file(s) to ${borrowerLabel(record)} on ${record.receiptNumber}`,
      });
    });

    return ok(record);
  },

  returnFiles(issueId, fileIds, condition) {
    const issue = issuesService.get(issueId);
    if (!issue) return err('Receipt not found.', 'issueId');
    if (!fileIds.length) return err('Select at least one file to return.', 'fileIds');

    const known = new Set(issue.lines.map((line) => line.fileId));
    const unknown = fileIds.filter((id) => !known.has(id));
    if (unknown.length > 0)
      return err('A selected file does not belong to this receipt.', 'fileIds');

    const now = timestamp();
    const updated: IssueRecord = {
      ...issue,
      lines: issue.lines.map((line) =>
        fileIds.includes(line.fileId) ? { ...line, returnedAt: now } : line,
      ),
    };
    updated.status = deriveStatus(updated);
    if (updated.status === 'Returned') updated.returnedAt = now;

    store.update((draft) => {
      const index = draft.issues.findIndex((item) => item.id === issueId);
      if (index < 0) return;
      draft.issues[index] = updated;

      fileIds.forEach((fileId) => {
        const fileIndex = draft.files.findIndex((item) => item.id === fileId);
        if (fileIndex < 0) return;
        const file = draft.files[fileIndex];
        draft.files[fileIndex] = {
          ...file,
          status: 'Available',
          holder: undefined,
          holderEmployeeCode: undefined,
          lastMovement: now,
          updatedAt: now.slice(0, 10),
          updatedBy: session.userName(),
        };
        draft.movements.unshift({
          id: newId('mv'),
          kind: 'Return',
          fileId: file.id,
          fileBarcode: file.fileBarcode,
          subject: file.subject,
          from: borrowerLabel(issue),
          to: file.location,
          actor: session.userName(),
          at: now,
          detail: `Returned against ${issue.receiptNumber}${condition ? ` — condition: ${condition}` : ''}.`,
          issueId: issue.id,
        });
      });

      log(draft, {
        action: 'Return',
        entity: 'IssueRecord',
        entityId: issueId,
        before: `status=${issue.status}, open=${issue.lines.filter((line) => !line.returnedAt).length}`,
        after: `status=${updated.status}, open=${updated.lines.filter((line) => !line.returnedAt).length}`,
        summary: `${fileIds.length} file(s) returned against ${issue.receiptNumber}`,
      });
    });

    return ok(updated);
  },

  overdue() {
    return store.getState().issues.filter((issue) => issue.status === 'Overdue');
  },

  nextReceiptNumber() {
    const year = new Date().getFullYear();
    const prefix = `ISS-${year}-`;
    const highest = store.getState().issues.reduce((max, issue) => {
      if (!issue.receiptNumber.startsWith(prefix)) return max;
      const serial = Number(issue.receiptNumber.slice(prefix.length));
      return Number.isFinite(serial) && serial > max ? serial : max;
    }, 0);
    return `${prefix}${String(highest + 1).padStart(4, '0')}`;
  },
};

export { deriveStatus, isOpen, borrowerLabel };
