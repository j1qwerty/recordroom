/**
 * Barcode centre service.
 *
 * Legacy `BarcodesPage` drew CSS bars and never validated a scan. This service
 * builds the real payload for each subject, mirrors the future
 * `/api/barcodes/validate` endpoint through `lib/barcode.parseScan`, and keeps
 * a print queue so a reprint is an auditable event rather than a silent action.
 */

import { err, ok, type BarcodeApi } from '../contracts';
import { newId, store, timestamp } from '../store';
import type { BarcodeJob, BarcodePayload, BarcodeSubject } from '../../types';
import { buildPayload, parseScan, SUBJECTS } from '../../lib/barcode';
import { log } from './audit';
import { filesService } from './files';
import { locationsService } from './locations';
import { session } from './session';

function findUnit(almirahId: string) {
  for (const room of store.getState().rooms) {
    const unit = room.storageUnits.find((item) => item.id === almirahId);
    if (unit) return unit;
  }
  return undefined;
}

function locate(targetId: string): BarcodePayload | null {
  const file = filesService.get(targetId);
  if (file) return buildPayload('File', file.fileBarcode, file.fileNumber);

  const shelf = locationsService.findShelf(targetId);
  if (shelf) return buildPayload('Shelf', shelf.barcode, shelf.code);

  const unit = findUnit(targetId);
  if (unit) return buildPayload('Almirah', unit.barcode, unit.code);

  const section = store
    .getState()
    .rooms.flatMap((item) => item.sections)
    .find((item) => item.id === targetId);
  if (section) return buildPayload('Section', section.code, section.name);

  const targetRoom = store.getState().rooms.find((item) => item.id === targetId);
  if (targetRoom) return buildPayload('Room', targetRoom.code, targetRoom.name);

  const area = store.getState().areas.find((item) => item.id === targetId);
  if (area) return buildPayload('Area', area.name, `${area.name} · ${area.pincode}`);

  return null;
}

export const barcodesService: BarcodeApi = {
  subjects: SUBJECTS,

  payloadFor(subject, id) {
    const payload = locate(id);
    if (!payload) return null;
    return payload.subject === subject ? payload : null;
  },

  validate: (raw) => parseScan(raw),

  jobs() {
    return [...store.getState().barcodeJobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  createJob(input) {
    const payload = locate(input.targetId);
    if (!payload) return err('Nothing to label for that target.', 'targetId');
    if (payload.subject !== input.subject) {
      return err(
        `That target is a ${payload.subject.toLowerCase()}, not a ${input.subject.toLowerCase()}.`,
        'subject',
      );
    }
    const quantity = Math.trunc(input.quantity);
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 500) {
      return err('Quantity must be between 1 and 500.', 'quantity');
    }

    const job: BarcodeJob = {
      id: newId('bj'),
      subject: input.subject,
      targetId: input.targetId,
      label: payload.label,
      symbology: 'Code128',
      value: payload.value,
      quantity,
      requestedBy: session.userName(),
      createdAt: timestamp(),
      status: 'Queued',
    };

    store.update((draft) => {
      draft.barcodeJobs.unshift(job);
      log(draft, {
        action: 'Create',
        entity: 'BarcodeJob',
        entityId: job.id,
        before: '—',
        after: `${payload.value} × ${quantity}`,
        summary: `Queued ${quantity} ${payload.subject.toLowerCase()} label(s) for ${payload.label}`,
      });
    });
    return ok(job);
  },

  cancelJob(id) {
    const job = store.getState().barcodeJobs.find((item) => item.id === id);
    if (!job) return err('Print job not found.', 'id');
    if (job.status === 'Printed')
      return err('Printed jobs cannot be cancelled; raise a reprint instead.', 'id');

    store.update((draft) => {
      const target = draft.barcodeJobs.find((item) => item.id === id);
      if (!target) return;
      target.status = 'Cancelled';
      log(draft, {
        action: 'Update',
        entity: 'BarcodeJob',
        entityId: id,
        before: `status=${job.status}`,
        after: 'status=Cancelled',
        summary: `Print job for ${target.label} cancelled`,
      });
    });
    return ok(true);
  },
};

export type { BarcodeSubject };
