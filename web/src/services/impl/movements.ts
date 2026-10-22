/**
 * Read-only projection over the movement events written by the write services.
 */

import type { MovementApi, MovementQuery } from '../contracts';
import { store } from '../store';
import type { MovementEvent } from '../../types';

export const movementsService: MovementApi = {
  async list(query: MovementQuery = {}) {
    const search = query.search?.trim().toLowerCase() ?? '';
    const rows: MovementEvent[] = store.getState().movements.filter((event) => {
      if (query.kind && query.kind !== 'All' && event.kind !== query.kind) return false;
      if (query.fileId && event.fileId !== query.fileId) return false;
      if (search) {
        const haystack =
          `${event.fileBarcode} ${event.subject} ${event.actor} ${event.detail} ${event.from} ${event.to}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
    rows.sort((a, b) => b.at.localeCompare(a.at));
    return rows.slice(0, query.limit ?? 300);
  },

  async recent(limit = 10) {
    return await movementsService.list({ limit });
  },
};
