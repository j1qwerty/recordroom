/**
 * Room → section → almirah → shelf hierarchy (`room_tbl`, `section_tbl`,
 * `almirah_tbl`, `shelf_tbl`).
 *
 * The legacy `Store_model.php` guards are the reason this module is not a set
 * of plain setters: a parent may only be removed when its children are empty,
 * and a file may only be placed on an active shelf.
 */

import {
  err,
  ok,
  type AlmirahInput,
  type LocationsApi,
  type SectionInput,
  type ShelfInput,
} from '../contracts';
import { newId, store, timestamp, type DbShape } from '../store';
import type { Room, Section, Shelf, StorageStatus, StorageUnit } from '../../types';
import { log } from './audit';
import { session } from './session';

const ACTIVE: StorageStatus = 'Active';

const findUnit = (draft: DbShape, id: string): StorageUnit | undefined =>
  draft.rooms.flatMap((room) => room.storageUnits).find((unit) => unit.id === id);

function unitFileCount(draft: DbShape, almirahId: string): number {
  return draft.files.filter((file) => file.almirahId === almirahId).length;
}

function shelfFileCount(draft: DbShape, shelfId: string): number {
  return draft.files.filter((file) => file.shelfId === shelfId).length;
}

function nextRevision(draft: DbShape, roomId: string): number {
  return draft.layoutRevisions.filter((rev) => rev.roomId === roomId).length + 1;
}

export const locationsService: LocationsApi = {
  async listRooms() {
    return store.getState().rooms;
  },

  async room(id) {
    return store.getState().rooms.find((room) => room.id === id) ?? null;
  },

  async sectionsOf(roomId) {
    const room = await locationsService.room(roomId);
    return room ? room.sections : [];
  },

  async unitsOf(sectionId) {
    const room = store
      .getState()
      .rooms.find((item) => item.sections.some((section) => section.id === sectionId));
    return room ? room.storageUnits.filter((unit) => unit.sectionId === sectionId) : [];
  },

  async shelvesOf(almirahId) {
    return findUnit(store.getState(), almirahId)?.shelves ?? [];
  },

  async findShelf(id) {
    for (const room of store.getState().rooms) {
      for (const unit of room.storageUnits) {
        const shelf = unit.shelves.find((row) => row.id === id);
        if (shelf) return shelf;
      }
    }
    return null;
  },

  async findShelfByBarcode(barcode) {
    const needle = barcode.trim().toUpperCase();
    if (!needle) return null;
    for (const room of store.getState().rooms) {
      for (const unit of room.storageUnits) {
        const shelf = unit.shelves.find((row) => row.barcode.toUpperCase() === needle);
        if (shelf) return shelf;
      }
    }
    return null;
  },

  async addSection(roomId, input: SectionInput) {
    const name = input.name.trim();
    if (!name) return err('Section name is required.', 'name');

    const room = await locationsService.room(roomId);
    if (!room) return err('Room not found.', 'roomId');
    if (room.sections.some((section) => section.name.toLowerCase() === name.toLowerCase())) {
      return err(`Section "${name}" already exists in ${room.code}.`, 'name');
    }

    const section: Section = {
      id: newId('sec'),
      roomId,
      code: `SEC-${name.toUpperCase()}`,
      name,
      status: input.status ?? ACTIVE,
      createdAt: timestamp().slice(0, 10),
      updatedAt: timestamp().slice(0, 10),
    };

    store.update((draft) => {
      const target = draft.rooms.find((item) => item.id === roomId);
      if (!target) return;
      target.sections.push(section);
      log(draft, {
        action: 'Create',
        entity: 'Section',
        entityId: section.id,
        before: '—',
        after: `${target.code} / ${section.code}`,
        summary: `Section ${section.name} added to ${target.code}`,
      });
    });
    return ok(section);
  },

  async updateSection(sectionId, input) {
    const location = store
      .getState()
      .rooms.find((room) => room.sections.some((section) => section.id === sectionId));
    const current = location?.sections.find((section) => section.id === sectionId);
    if (!location || !current) return err('Section not found.', 'sectionId');

    const nextName = input.name?.trim() ?? current.name;
    if (
      location.sections.some(
        (section) =>
          section.id !== sectionId && section.name.toLowerCase() === nextName.toLowerCase(),
      )
    ) {
      return err(`Section "${nextName}" already exists in ${location.code}.`, 'name');
    }

    // Legacy guard: a section may not be deactivated while it still holds
    // active almirahs, because files would lose a resolvable parent.
    if (input.status && input.status !== ACTIVE) {
      const activeUnits = location.storageUnits.filter(
        (unit) => unit.sectionId === sectionId && unit.status === ACTIVE,
      );
      if (activeUnits.length > 0) {
        return err(
          `Deactivate or remove ${activeUnits.length} active almirah(s) in this section first.`,
          'status',
        );
      }
    }

    const updated: Section = {
      ...current,
      name: nextName,
      code: `SEC-${nextName.toUpperCase()}`,
      status: input.status ?? current.status,
      updatedAt: timestamp().slice(0, 10),
    };

    store.update((draft) => {
      const room = draft.rooms.find((item) => item.id === location.id);
      const index = room?.sections.findIndex((section) => section.id === sectionId) ?? -1;
      if (index < 0) return;
      room!.sections[index] = updated;
      log(draft, {
        action: 'Update',
        entity: 'Section',
        entityId: sectionId,
        before: `${current.code} / ${current.status}`,
        after: `${updated.code} / ${updated.status}`,
        summary: `Section ${current.name} updated`,
      });
    });
    return ok(updated);
  },

  async deleteSection(sectionId) {
    const room = store
      .getState()
      .rooms.find((item) => item.sections.some((section) => section.id === sectionId));
    const section = room?.sections.find((item) => item.id === sectionId);
    if (!room || !section) return err('Section not found.', 'sectionId');

    const units = room.storageUnits.filter((unit) => unit.sectionId === sectionId);
    if (units.length > 0) {
      return err(`Remove the ${units.length} almirah(s) in ${section.name} first.`, 'sectionId');
    }

    store.update((draft) => {
      const target = draft.rooms.find((item) => item.id === room.id);
      if (!target) return;
      target.sections = target.sections.filter((item) => item.id !== sectionId);
      log(draft, {
        action: 'Delete',
        entity: 'Section',
        entityId: sectionId,
        before: `${room.code} / ${section.code}`,
        after: 'deleted',
        summary: `Section ${section.name} removed from ${room.code}`,
      });
    });
    return ok(true);
  },

  async addAlmirah(sectionId, input: AlmirahInput) {
    const room = store
      .getState()
      .rooms.find((item) => item.sections.some((section) => section.id === sectionId));
    const section = room?.sections.find((item) => item.id === sectionId);
    if (!room || !section) return err('Section not found.', 'sectionId');

    const code = input.code.trim().toUpperCase();
    if (!code) return err('Almirah code is required.', 'code');
    if (room.storageUnits.some((unit) => unit.code.toUpperCase() === code)) {
      return err(`Almirah code ${code} is already used.`, 'code');
    }

    const unit: StorageUnit = {
      id: newId('unit'),
      sectionId,
      roomId: room.id,
      barcode: (input.barcode ?? code.replace(/-/g, '')).trim().toUpperCase(),
      code,
      name: input.name.trim() || code,
      type: input.type ?? 'Almirah',
      status: ACTIVE,
      x: input.x ?? 12,
      y: input.y ?? 10,
      width: input.width ?? 20,
      height: input.height ?? 76,
      shelves: [],
    };

    store.update((draft) => {
      const target = draft.rooms.find((item) => item.id === room.id);
      if (!target) return;
      target.storageUnits.push(unit);
      log(draft, {
        action: 'Create',
        entity: 'StorageUnit',
        entityId: unit.id,
        before: '—',
        after: `${target.code} / ${section.code} / ${unit.code}`,
        summary: `Almirah ${unit.code} added to ${section.name}`,
      });
    });
    return ok(unit);
  },

  async updateAlmirah(almirahId, input) {
    const draftState = store.getState();
    const unit = findUnit(draftState, almirahId);
    if (!unit) return err('Almirah not found.', 'almirahId');

    const room = draftState.rooms.find((item) => item.id === unit.roomId);
    const code = input.code?.trim().toUpperCase() ?? unit.code;
    if (code !== unit.code && room?.storageUnits.some((item) => item.code.toUpperCase() === code)) {
      return err(`Almirah code ${code} is already used.`, 'code');
    }

    const updated: StorageUnit = {
      ...unit,
      code,
      name: input.name?.trim() || unit.name,
      type: input.type ?? unit.type,
      barcode: input.barcode?.trim().toUpperCase() ?? unit.barcode,
      x: input.x ?? unit.x,
      y: input.y ?? unit.y,
      width: input.width ?? unit.width,
      height: input.height ?? unit.height,
    };

    store.update((draft) => {
      const roomDraft = draft.rooms.find((item) => item.id === unit.roomId);
      const index = roomDraft?.storageUnits.findIndex((item) => item.id === almirahId) ?? -1;
      if (!roomDraft || index < 0) return;
      roomDraft.storageUnits[index] = updated;
      log(draft, {
        action: 'Update',
        entity: 'StorageUnit',
        entityId: almirahId,
        before: `${unit.code}`,
        after: `${updated.code}`,
        summary: `Almirah ${unit.code} updated`,
      });
    });
    return ok(updated);
  },

  async deleteAlmirah(almirahId) {
    const unit = findUnit(store.getState(), almirahId);
    if (!unit) return err('Almirah not found.', 'almirahId');
    const fileCount = unitFileCount(store.getState(), almirahId);
    if (fileCount > 0) {
      return err(
        `${fileCount} file(s) still reference this almirah. Relocate them first.`,
        'almirahId',
      );
    }
    if (unit.shelves.length > 0) {
      return err(`Remove the ${unit.shelves.length} shelf label(s) first.`, 'almirahId');
    }

    store.update((draft) => {
      const room = draft.rooms.find((item) => item.id === unit.roomId);
      if (!room) return;
      room.storageUnits = room.storageUnits.filter((item) => item.id !== almirahId);
      log(draft, {
        action: 'Delete',
        entity: 'StorageUnit',
        entityId: almirahId,
        before: `${unit.code} / ${unit.status}`,
        after: 'deleted',
        summary: `Almirah ${unit.code} removed`,
      });
    });
    return ok(true);
  },

  async addShelf(almirahId, input: ShelfInput) {
    const unit = findUnit(store.getState(), almirahId);
    if (!unit) return err('Almirah not found.', 'almirahId');

    const code = input.code.trim().toUpperCase();
    const barcode = input.barcode.trim().toUpperCase();
    if (!code) return err('Shelf code is required.', 'code');
    if (!barcode) return err('Shelf barcode is required.', 'barcode');
    if (await locationsService.findShelfByBarcode(barcode)) {
      return err(`Shelf barcode ${barcode} is already registered.`, 'barcode');
    }
    if (unit.shelves.some((shelf) => shelf.code.toUpperCase() === code)) {
      return err(`Shelf code ${code} already exists in ${unit.code}.`, 'code');
    }

    const shelf: Shelf = {
      id: newId('shelf'),
      almirahId,
      barcode,
      code,
      name: input.name.trim() || code,
      status: input.status ?? ACTIVE,
      capacity: Math.max(1, input.capacity ?? 80),
      occupied: 0,
      position: unit.shelves.length,
    };

    store.update((draft) => {
      const target = findUnit(draft, almirahId);
      if (!target) return;
      target.shelves.push(shelf);
      log(draft, {
        action: 'Create',
        entity: 'Shelf',
        entityId: shelf.id,
        before: '—',
        after: `${unit.code} / ${shelf.code}`,
        summary: `Shelf ${shelf.code} added with barcode ${shelf.barcode}`,
      });
    });
    return ok(shelf);
  },

  async updateShelf(shelfId, input: Partial<ShelfInput>) {
    const current = await locationsService.findShelf(shelfId);
    if (!current) return err('Shelf not found.', 'shelfId');

    const barcode = input.barcode?.trim().toUpperCase() ?? current.barcode;
    if (barcode !== current.barcode && (await locationsService.findShelfByBarcode(barcode))) {
      return err(`Shelf barcode ${barcode} is already registered.`, 'barcode');
    }

    const updated: Shelf = {
      ...current,
      code: input.code?.trim().toUpperCase() ?? current.code,
      name: input.name?.trim() ?? current.name,
      barcode,
      status: input.status ?? current.status,
      capacity: input.capacity === undefined ? current.capacity : Math.max(1, input.capacity),
    };

    store.update((draft) => {
      const unit = findUnit(draft, current.almirahId);
      const index = unit?.shelves.findIndex((shelf) => shelf.id === shelfId) ?? -1;
      if (!unit || index < 0) return;
      unit.shelves[index] = updated;
      log(draft, {
        action: 'Update',
        entity: 'Shelf',
        entityId: shelfId,
        before: `${current.code} / ${current.status} / ${current.barcode}`,
        after: `${updated.code} / ${updated.status} / ${updated.barcode}`,
        summary: `Shelf ${current.code} updated`,
      });
    });
    return ok(updated);
  },

  async deleteShelf(shelfId) {
    const current = await locationsService.findShelf(shelfId);
    if (!current) return err('Shelf not found.', 'shelfId');
    const fileCount = shelfFileCount(store.getState(), shelfId);
    if (fileCount > 0) {
      return err(`${fileCount} file(s) sit on this shelf. Relocate them first.`, 'shelfId');
    }

    store.update((draft) => {
      const unit = findUnit(draft, current.almirahId);
      if (!unit) return;
      unit.shelves = unit.shelves
        .filter((shelf) => shelf.id !== shelfId)
        .map((shelf, index) => ({ ...shelf, position: index }));
      log(draft, {
        action: 'Delete',
        entity: 'Shelf',
        entityId: shelfId,
        before: `${current.code} / ${current.barcode}`,
        after: 'deleted',
        summary: `Shelf ${current.code} removed`,
      });
    });
    return ok(true);
  },

  async setUnitStatus(almirahId, status) {
    const unit = findUnit(store.getState(), almirahId);
    if (!unit) return err('Almirah not found.', 'almirahId');
    if (status !== ACTIVE && unit.status === ACTIVE) {
      const fileCount = unitFileCount(store.getState(), almirahId);
      if (fileCount > 0) {
        return err(
          `${fileCount} file(s) reference this almirah. Move them or mark it Maintenance instead of Inactive.`,
          'status',
        );
      }
    }

    const updated = { ...unit, status };
    store.update((draft) => {
      const target = draft.rooms
        .find((item) => item.id === unit.roomId)
        ?.storageUnits.findIndex((item) => item.id === almirahId);
      if (target === undefined || target < 0) return;
      draft.rooms.find((item) => item.id === unit.roomId)!.storageUnits[target] = updated;
      log(draft, {
        action: 'Update',
        entity: 'StorageUnit',
        entityId: almirahId,
        before: `status=${unit.status}`,
        after: `status=${status}`,
        summary: `Almirah ${unit.code} status changed to ${status}`,
      });
    });
    return ok(updated);
  },

  async saveLayout(roomId, note) {
    const room = await locationsService.room(roomId);
    if (!room) return err('Room not found.', 'roomId');

    let revision = 0;
    store.update((draft) => {
      revision = nextRevision(draft, roomId);
      draft.layoutRevisions.unshift({
        roomId,
        revision,
        note: note.trim() || 'Layout saved',
        at: timestamp(),
        actor: session.userName(),
      });
      log(draft, {
        action: 'Update',
        entity: 'Room',
        entityId: roomId,
        before: `revision=${revision - 1}`,
        after: `revision=${revision}`,
        summary: `Layout revision ${revision} saved for ${room.code}`,
      });
    });
    return ok({ revision });
  },

  async layoutRevisions(roomId) {
    return store
      .getState()
      .layoutRevisions.filter((revision) => revision.roomId === roomId)
      .map(({ revision, note, at, actor }) => ({ revision, note, at, actor }));
  },

  async occupancy() {
    return store.getState().rooms.map((room: Room) => ({
      room,
      sections: room.sections.map((section: Section) => {
        const units = room.storageUnits.filter((unit) => unit.sectionId === section.id);
        const shelves = units.flatMap((unit) => unit.shelves);
        return {
          section,
          almirahs: units.length,
          shelves: shelves.length,
          capacity: shelves.reduce((sum, shelf) => sum + shelf.capacity, 0),
        };
      }),
    }));
  },

  async areas() {
    return store.getState().areas;
  },
};
