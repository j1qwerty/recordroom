/**
 * Single entry point for the whole frontend data layer.
 *
 * Pages import `service` from here (or the hooks in `../hooks/useService`) and
 * never touch `src/data/mock.ts` directly. Swapping the in-memory adapter for
 * `fetch` against `dotnet-api/` means replacing this object only.
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
import { usersService } from './impl/users';
import { inquiriesService, mediaService } from './impl/inquiries';

export const service: RecordRoomService = {
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
  reset: () => store.reset(),
};

export type { RecordRoomService } from './contracts';
export { can, permissionsFor, ROLE_DESCRIPTIONS, PERMISSIONS } from './permissions';
export type { Permission } from './permissions';
export { store } from './store';
export type { DbShape } from './store';
export { session } from './impl/session';
export { exportReport } from './impl/reports';
export { AUDIT_ACTIONS, auditRowsToCsv } from './impl/audit';
