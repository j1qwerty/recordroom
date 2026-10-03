/**
 * Employee-linked digitization batches and `upload_file` page versioning.
 *
 * Legacy `User.php` (uploadservice / upload_service_book / upload_leave_report
 * / upload_sr / upload_apar) wrote into per-employee folders
 * `uploads/<empcode>/<folder>/` where each page carries `pageno` + `version`,
 * and `Employee_reports` approved or rejected rows after an OCR quality check.
 * A repeated `fileBarcode` + `pageNo` pair becomes a new `version` rather than
 * an overwrite.
 */

import { err, ok, type DigitizationApi, type DigitizationQuery } from '../contracts';
import { newId, store, timestamp } from '../store';
import type { BatchStatus, DigitizationBatch, DigitizationPage, PageStatus } from '../../types';
import { log } from './audit';
import { employeesService } from './employees';
import { filesService } from './files';
import { session } from './session';

function batchStatus(pages: DigitizationPage[], submitted: boolean): BatchStatus {
  const reviewable = pages.filter(
    (page) => page.status === 'Pending review' || page.status === 'Duplicate',
  );
  if (reviewable.length > 0) return submitted ? 'Submitted' : 'In progress';
  if (pages.length === 0) return submitted ? 'Submitted' : 'In progress';
  const approved = pages.filter((page) => page.status === 'Approved').length;
  if (approved === pages.length) return 'Approved';
  if (approved === 0) return 'In progress';
  return 'Partially approved';
}

export const digitizationService: DigitizationApi = {
  async batches(query: DigitizationQuery = {}) {
    const search = query.search?.trim().toLowerCase() ?? '';
    const rows = store.getState().batches.filter((batch) => {
      if (query.employeeCode && batch.employeeCode !== query.employeeCode) return false;
      if (query.folder && query.folder !== 'All' && batch.folder !== query.folder) return false;
      if (query.status && query.status !== 'All' && batch.status !== query.status) return false;
      if (search) {
        const haystack =
          `${batch.code} ${batch.employeeCode} ${batch.employeeName} ${batch.pages.map((page) => page.fileBarcode).join(' ')}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async batch(id) {
    return store.getState().batches.find((batch) => batch.id === id) ?? null;
  },

  async createBatch(input) {
    const employee = await employeesService.byCode(input.employeeCode);
    if (!employee) return err('Select a registered employee.', 'employeeCode');
    if (employee.status !== 'Active') {
      return err(
        `${employee.name} is ${employee.status.toLowerCase()} and cannot own new batches.`,
        'employeeCode',
      );
    }

    const state = store.getState();
    const alreadyOpen = state.batches.find(
      (batch) =>
        batch.employeeCode === employee.employeeCode &&
        batch.folder === input.folder &&
        batch.status !== 'Approved',
    );
    if (alreadyOpen) {
      return err(
        `${alreadyOpen.code} is already ${alreadyOpen.status.toLowerCase()} for this folder.`,
        'folder',
      );
    }

    const serial = state.batches.length + 39;
    const batch: DigitizationBatch = {
      id: newId('batch'),
      code: `BATCH-${String(serial).padStart(3, '0')}`,
      employeeCode: employee.employeeCode,
      employeeName: employee.name,
      department: employee.department,
      folder: input.folder,
      status: 'In progress',
      pages: [],
      createdAt: timestamp().slice(0, 10),
      createdBy: session.userName(),
      submittedAt: null,
    };

    store.update((draft) => {
      draft.batches.unshift(batch);
      log(draft, {
        action: 'Create',
        entity: 'DigitizationBatch',
        entityId: batch.id,
        before: '—',
        after: `${batch.code} · ${employee.employeeCode} · ${input.folder}`,
        summary: `${batch.code} opened for ${employee.name} (${input.folder.replace('_', ' ')})`,
      });
    });
    return ok(batch);
  },

  folderPath(batch) {
    return `uploads/${batch.employeeCode}/${batch.folder}/`;
  },

  async uploadPage(batchId, input) {
    const batch = await digitizationService.batch(batchId);
    if (!batch) return err('Batch not found.', 'batchId');
    if (batch.status === 'Approved') return err('Approved batches are read-only.', 'batchId');

    const file = await filesService.byBarcode(input.fileBarcode);
    if (!file) return err(`${input.fileBarcode} is not in the registry.`, 'fileBarcode');
    if (input.pageNo < 1) return err('Page number starts at 1.', 'pageNo');

    // Legacy duplicate-page check: same file + page, lower version, already
    // uploaded ⇒ this is a rescan, so store it as the next version.
    const siblings = store
      .getState()
      .batches.flatMap((row) => row.pages)
      .filter((page) => page.fileBarcode === file.fileBarcode && page.pageNo === input.pageNo);
    const nextVersion = siblings.reduce((max, page) => Math.max(max, page.version), 0) + 1;

    // Bulk staging rows (`bulk/Temp00432/`) import at version 1 with a note;
    // everything else is a fresh page or a rescan of an existing one.
    const page: DigitizationPage = {
      id: newId('page'),
      batchId,
      fileBarcode: file.fileBarcode,
      filename:
        input.filename.trim() ||
        `${file.fileBarcode}-FILE-${input.pageNo}${nextVersion > 1 ? `-V${nextVersion}` : ''}.pdf`,
      pageNo: input.pageNo,
      version: nextVersion,
      status:
        nextVersion > 1 && siblings.some((row) => row.status === 'Active')
          ? 'Duplicate'
          : 'Pending review',
      note: input.bulk
        ? 'Imported from a bulk staging folder.'
        : nextVersion > 1
          ? `Rescan of an existing page (previous version ${nextVersion - 1}).`
          : '',
      uploadedAt: timestamp(),
      uploadedBy: session.userName(),
      bulk: input.bulk,
    };

    store.update((draft) => {
      const target = draft.batches.find((row) => row.id === batchId);
      if (!target) return;
      target.pages.push(page);
      target.status = batchStatus(target.pages, target.submittedAt !== null);
      log(draft, {
        action: 'Create',
        entity: 'DigitizationPage',
        entityId: page.id,
        before: '—',
        after: `${page.filename} · v${page.version}${page.bulk ? ' · bulk' : ''}`,
        summary: `Page ${page.pageNo} of ${file.fileBarcode} added to ${target.code}`,
      });
    });
    return ok(page);
  },

  async removePage(pageId) {
    const state = store.getState();
    const owner = state.batches.find((batch) => batch.pages.some((page) => page.id === pageId));
    const page = owner?.pages.find((row) => row.id === pageId);
    if (!owner || !page) return err('Page not found.', 'pageId');
    if (owner.status === 'Approved') return err('Approved batches are read-only.', 'pageId');

    store.update((draft) => {
      const target = draft.batches.find((row) => row.id === owner.id);
      if (!target) return;
      target.pages = target.pages.filter((row) => row.id !== pageId);
      target.status = batchStatus(target.pages, target.submittedAt !== null);
      log(draft, {
        action: 'Delete',
        entity: 'DigitizationPage',
        entityId: pageId,
        before: `${page.filename} · v${page.version}`,
        after: 'deleted',
        summary: `Page removed from ${target.code}`,
      });
    });
    return ok(true);
  },

  async reviewPage(pageId, decision, note) {
    const state = store.getState();
    const owner = state.batches.find((batch) => batch.pages.some((page) => page.id === pageId));
    const page = owner?.pages.find((row) => row.id === pageId);
    if (!owner || !page) return err('Page not found.', 'pageId');
    if (decision === 'Rejected' && !note.trim()) {
      return err('A rejection reason is required.', 'note');
    }

    const status: PageStatus = decision === 'Approved' ? 'Approved' : 'Rejected';
    store.update((draft) => {
      const target = draft.batches.find((row) => row.id === owner.id);
      if (!target) return;
      const updatedPage: DigitizationPage = { ...page, status, note: note.trim() || page.note };
      target.pages = target.pages.map((row) => (row.id === pageId ? updatedPage : row));
      target.status = batchStatus(target.pages, target.submittedAt !== null);
      log(draft, {
        action: decision === 'Approved' ? 'Approve' : 'Reject',
        entity: 'DigitizationPage',
        entityId: pageId,
        before: `status=${page.status}`,
        after: `status=${status}`,
        summary: `${page.filename} ${status.toLowerCase()}${note ? ` — ${note}` : ''}`,
      });
    });

    // Re-read rather than mutate a snapshot: the page list is derived from the
    // store, and a stale copy would report the pre-review status.
    const refreshed = await digitizationService.batch(owner.id);
    const updated = refreshed?.pages.find((row) => row.id === pageId);
    if (!updated) return err('Page not found after review.', 'pageId');
    return ok(updated);
  },

  async reviewBatch(batchId, decision, note) {
    const batch = await digitizationService.batch(batchId);
    if (!batch) return err('Batch not found.', 'batchId');
    const reviewable = batch.pages.filter((page) => page.status === 'Pending review');
    if (reviewable.length === 0) return err('No pages are awaiting review.', 'batchId');
    if (decision === 'Rejected' && !note.trim()) {
      return err('A rejection reason is required.', 'note');
    }

    const status: PageStatus = decision === 'Approved' ? 'Approved' : 'Rejected';
    const now = timestamp();
    store.update((draft) => {
      const target = draft.batches.find((row) => row.id === batchId);
      if (!target) return;
      const ids = new Set(reviewable.map((page) => page.id));
      target.pages = target.pages.map((page) =>
        ids.has(page.id) ? { ...page, status, note: note.trim() || page.note } : page,
      );
      target.status = batchStatus(target.pages, target.submittedAt !== null);
      target.submittedAt = target.submittedAt ?? now.slice(0, 10);
      log(draft, {
        action: decision === 'Approved' ? 'Approve' : 'Reject',
        entity: 'DigitizationBatch',
        entityId: batchId,
        before: `pending=${reviewable.length}`,
        after: `${status.toLowerCase()}=${reviewable.length}`,
        summary: `${target.code}: ${reviewable.length} page(s) ${status.toLowerCase()}`,
      });
    });
    const reviewed = await digitizationService.batch(batchId);
    return reviewed ? ok(reviewed) : err('Batch not found after review.', 'batchId');
  },

  async pendingReviewCount() {
    return store
      .getState()
      .batches.flatMap((batch) => batch.pages)
      .filter((page) => page.status === 'Pending review').length;
  },
};
