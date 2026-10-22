/**
 * Single entry point for the whole frontend data layer.
 *
 * Pages import `service` from here (or the hooks in `../hooks/useService`) and
 * never touch `src/data/mock.ts` or the HTTP client directly.
 *
 * Two implementations satisfy `RecordRoomService`:
 *
 * - `./impl` — in-memory, seeded from `src/data/mock.ts`. No backend needed.
 * - `./http` — the .NET 10 API in `dotnet-api/`, which owns paging, filtering,
 *   sorting and every business rule.
 *
 * `VITE_API_MODE` picks between them and defaults to `local`, so the app still
 * runs with no backend. Set `VITE_API_MODE=http` to exercise the real API.
 */

import type { RecordRoomService } from './contracts';
import { store } from './store';
import { auditService } from './impl/audit';
import { authService } from './impl/auth';
import { barcodesService } from './impl/barcodes';
import { bulkService } from './impl/bulk';
import { dashboardService } from './impl/dashboard';
import { digitizationService } from './impl/digitization';
import { employeesService } from './impl/employees';
import { filesService } from './impl/files';
import { issuesService } from './impl/issues';
import { locationsService } from './impl/locations';
import { movementsService } from './impl/movements';
import { reportsService } from './impl/reports';
import { uploadsService } from './impl/uploads';
import { clearLocalDocumentStorage } from './impl/document-storage';
import { usersService } from './impl/users';
import { inquiriesService, mediaService } from './impl/inquiries';
import {
  httpAuditService,
  httpAuthService,
  httpBarcodesService,
  httpBulkService,
  httpDashboardService,
  httpDigitizationService,
  httpEmployeesService,
  httpFilesService,
  httpInquiriesService,
  httpIssuesService,
  httpLocationsService,
  httpMediaService,
  httpMovementsService,
  httpReportsService,
  httpUploadsService,
  httpUsersService,
} from './http';
import { apiBase } from './http/client';

const useHttp = import.meta.env.VITE_API_MODE === 'http';

const localService: RecordRoomService = {
  auth: authService,
  locations: locationsService,
  files: filesService,
  issues: issuesService,
  movements: movementsService,
  employees: employeesService,
  digitization: digitizationService,
  uploads: uploadsService,
  bulk: bulkService,
  audit: auditService,
  reports: reportsService,
  barcodes: barcodesService,
  dashboard: dashboardService,
  users: usersService,
  inquiries: inquiriesService,
  media: mediaService,
  async reset() {
    store.reset();
    clearLocalDocumentStorage();
  },
};

const httpService: RecordRoomService = {
  auth: httpAuthService,
  locations: httpLocationsService,
  files: httpFilesService,
  issues: httpIssuesService,
  movements: httpMovementsService,
  employees: httpEmployeesService,
  digitization: httpDigitizationService,
  uploads: httpUploadsService,
  bulk: httpBulkService,
  audit: httpAuditService,
  reports: httpReportsService,
  barcodes: httpBarcodesService,
  dashboard: httpDashboardService,
  users: httpUsersService,
  inquiries: httpInquiriesService,
  media: httpMediaService,
  async reset() {
    // The API owns the data; there is no local snapshot to reload. A reload is
    // the honest equivalent of "start again from the seed".
    window.location.reload();
  },
};

export const service: RecordRoomService = useHttp ? httpService : localService;

/** Which implementation is live, for the shell's connection indicator. */
export const dataSource: 'api' | 'local' = useHttp ? 'api' : 'local';

export { apiBase };

export type { RecordRoomService } from './contracts';
export { can, permissionsFor, ROLE_DESCRIPTIONS, PERMISSIONS } from './permissions';
export type { Permission } from './permissions';
export { store } from './store';
export type { DbShape } from './store';
export { session } from './impl/session';
export { exportReport } from './impl/reports';
export { AUDIT_ACTIONS, auditRowsToCsv } from './impl/audit';
