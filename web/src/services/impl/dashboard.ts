/**
 * Dashboard aggregates.
 *
 * The legacy `search_dashboard_file` screen derived its counts from SQL. The
 * frontend version reads the same collections through the service layer, so
 * the cards stop contradicting the tables they summarise.
 */

import type { DashboardApi } from '../contracts';
import { store } from '../store';
import type { DashboardStats, TimelineEvent } from '../../types';
import { digitizationService } from './digitization';
import { issuesService } from './issues';

const TOTAL_RECORDS_HISTORICAL = 2_478_450;

export const dashboardService: DashboardApi = {
  async stats(): Promise<DashboardStats> {
    const state = store.getState();
    const openIssues = state.issues.filter((issue) => issue.status !== 'Returned');
    const overdue = await issuesService.overdue();
    const dueToday = openIssues.filter((issue) => {
      const days = Math.ceil((new Date(issue.dueAt).getTime() - Date.now()) / 86_400_000);
      return days <= 0;
    }).length;

    const pages = state.batches.flatMap((batch) => batch.pages);
    const approvedPages = pages.filter((page) => page.status === 'Approved').length;

    // `Showing 1-6 of 2,478,450` honesty: the registry total is the legacy
    // collection size, the loaded page is what the browser actually holds.
    const registered = TOTAL_RECORDS_HISTORICAL;
    const withShelf = registered - state.files.filter((file) => !file.shelfId).length;

    return {
      totalRecords: registered,
      mappedPercent: Number(((withShelf / registered) * 100).toFixed(1)),
      issuedNow: state.files.filter((file) => file.status === 'Issued').length,
      dueToday,
      digitizationPercent: pages.length
        ? Number(((approvedPages / pages.length) * 100).toFixed(1))
        : 0,
      overdueCount: overdue.length,
      roomCount: state.rooms.length,
      activeBorrowers: (await issuesService.borrowers()).length,
      pendingApprovals: await digitizationService.pendingReviewCount(),
    };
  },

  async activity(limit = 6): Promise<TimelineEvent[]> {
    const toneFor = (kind: string): TimelineEvent['tone'] => {
      if (kind === 'Issue') return 'warning';
      if (kind === 'Return') return 'success';
      if (kind === 'Location change') return 'default';
      return 'default';
    };

    return store
      .getState()
      .movements.slice()
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, limit)
      .map((event) => ({
        id: event.id,
        label: event.kind,
        date: event.at.slice(5, 16).replace('T', ' '),
        actor: `${event.kind} · ${event.actor}`,
        detail: `${event.fileBarcode} — ${event.detail}`,
        tone: toneFor(event.kind),
      }));
  },
};
