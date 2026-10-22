/**
 * `upload_map` — scanned maps and file copies.
 *
 * Legacy views `uploadfile/upload_map/viewmap/viewfilecopy` listed these rows
 * next to the registry; there was no frontend page for them. A map row is
 * versioned the same way as a scanned page, so a corrected scan supersedes the
 * earlier one instead of replacing it silently.
 */

import { err, ok, type UploadsApi } from '../contracts';
import { newId, store, timestamp } from '../store';
import type { MapUpload } from '../../types';
import { log } from './audit';
import { filesService } from './files';
import { session } from './session';
import { localDocumentBlob, saveLocalRowDocument } from './document-storage';
import { validateDocumentFile } from '../../lib/document';

export const uploadsService: UploadsApi = {
  async maps(query = {}) {
    const search = query.search?.trim().toLowerCase() ?? '';
    const needle = query.fileBarcode?.trim().toUpperCase();
    return store
      .getState()
      .maps.filter((row) => {
        if (needle && row.fileBarcode.toUpperCase() !== needle) return false;
        if (search) {
          const haystack = `${row.fileBarcode} ${row.filename} ${row.status}`.toLowerCase();
          if (!haystack.includes(search)) return false;
        }
        return true;
      })
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  },

  async addMap(input) {
    const file = await filesService.byBarcode(input.fileBarcode);
    if (!file) return err(`${input.fileBarcode} is not in the registry.`, 'fileBarcode');
    if (input.pageNo < 1) return err('Page number starts at 1.', 'pageNo');
    if (!input.filename.trim()) return err('File name is required.', 'filename');
    if (!Number.isFinite(input.sizeKb) || input.sizeKb <= 0) {
      return err('Enter the scan size in KB.', 'sizeKb');
    }

    const siblings = store
      .getState()
      .maps.filter((row) => row.fileBarcode === file.fileBarcode && row.pageNo === input.pageNo);
    const version = siblings.reduce((max, row) => Math.max(max, row.version), 0) + 1;

    const row: MapUpload = {
      id: newId('map'),
      fileBarcode: file.fileBarcode,
      filename: input.filename.trim(),
      pageNo: input.pageNo,
      version,
      status: 'Pending review',
      uploadedAt: timestamp(),
      uploadedBy: session.userName(),
      sizeKb: Math.round(input.sizeKb),
    };

    store.update((draft) => {
      draft.maps.unshift(row);
      // A newer version retires the previous row's "current" claim.
      if (version > 1) {
        draft.maps.forEach((existing) => {
          if (
            existing.fileBarcode === row.fileBarcode &&
            existing.pageNo === row.pageNo &&
            existing.version < version &&
            existing.status === 'Approved'
          ) {
            existing.status = 'Duplicate';
          }
        });
      }
      log(draft, {
        action: 'Create',
        entity: 'MapUpload',
        entityId: row.id,
        before: version > 1 ? `version=${version - 1}` : '—',
        after: `${row.filename} · v${row.version}`,
        summary: `Map page added for ${row.fileBarcode}`,
      });
    });
    return ok(row);
  },

  async uploadMapDocument(id, file) {
    const issue = validateDocumentFile(file);
    if (issue) return err(issue, 'document');
    const original = store.getState().maps.find((row) => row.id === id);
    if (!original) return err('Map not found.', 'id');
    // A page registered without a scan is filled in place; only a page that
    // already has one gets a new version row.
    if (!original.hasDocument) {
      const info = await saveLocalRowDocument('map', original.id, file);
      const filled = {
        ...original,
        ...info,
        filename: file.name,
        sizeKb: Math.max(1, Math.ceil(file.size / 1024)),
        hasDocument: true,
      };
      store.update((draft) => {
        const index = draft.maps.findIndex((row) => row.id === original.id);
        if (index >= 0) draft.maps[index] = filled;
      });
      return ok(filled);
    }
    const created = await uploadsService.addMap({
      fileBarcode: original.fileBarcode,
      pageNo: original.pageNo,
      filename: file.name,
      sizeKb: Math.max(1, Math.ceil(file.size / 1024)),
    });
    if (!created.ok) return created;
    const info = await saveLocalRowDocument('map', created.value.id, file);
    const updated = { ...created.value, ...info, hasDocument: true };
    store.update((draft) => {
      const index = draft.maps.findIndex((row) => row.id === created.value.id);
      if (index >= 0) draft.maps[index] = updated;
    });
    return ok(updated);
  },

  async mapBlob(id) {
    return localDocumentBlob('map', id);
  },

  async removeMap(id) {
    const row = store.getState().maps.find((item) => item.id === id);
    if (!row) return err('Map not found.', 'id');
    store.update((draft) => {
      draft.maps = draft.maps.filter((item) => item.id !== id);
      log(draft, {
        action: 'Delete',
        entity: 'MapUpload',
        entityId: id,
        before: `${row.filename} · v${row.version}`,
        after: 'deleted',
        summary: `Map page removed for ${row.fileBarcode}`,
      });
    });
    return ok(true);
  },
};
