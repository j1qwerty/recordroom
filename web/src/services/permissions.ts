/**
 * Role → permission matrix.
 *
 * Legacy `drm_employee.role` is a 2-char code: 1 Supervisor, 2 Operator,
 * 3 Employee, and `User.php` maps the `admin` login to Admin. The frontend
 * keeps those four roles and adds the permission names the UI needs.
 *
 * This is UX gating only. `docs/SECURITY.md` requires the .NET 10 API to
 * re-check every one of these server-side — hiding a control is not
 * authorization.
 */

import type { Role } from '../types';

export const PERMISSIONS = [
  'files.view',
  'files.create',
  'files.edit',
  'files.bulkImport',
  'issue.issue',
  'issue.return',
  'locations.view',
  'locations.edit',
  'digitization.view',
  'digitization.upload',
  'digitization.review',
  'employees.view',
  'employees.edit',
  'users.view',
  'users.edit',
  'audit.view',
  'reports.view',
  'reports.export',
  'barcodes.print',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const matrix: Record<Role, readonly Permission[]> = {
  Admin: PERMISSIONS,
  Supervisor: [
    'files.view',
    'files.create',
    'files.edit',
    'files.bulkImport',
    'issue.issue',
    'issue.return',
    'locations.view',
    'locations.edit',
    'digitization.view',
    'digitization.upload',
    'digitization.review',
    'employees.view',
    'employees.edit',
    'users.view',
    'audit.view',
    'reports.view',
    'reports.export',
    'barcodes.print',
  ],
  Operator: [
    'files.view',
    'files.create',
    'issue.issue',
    'issue.return',
    'locations.view',
    'digitization.view',
    'digitization.upload',
    'employees.view',
    'reports.view',
    'barcodes.print',
  ],
  Employee: ['files.view', 'digitization.view', 'reports.view'],
};

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return matrix[role].includes(permission);
}

export function permissionsFor(role: Role): readonly Permission[] {
  return matrix[role];
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  Admin: 'Full access including users, locations and configuration.',
  Supervisor: 'Approves digitization, manages locations and employee records.',
  Operator: 'Runs the desks: file creation, issue, return and scanning.',
  Employee: 'Reads own registry and digitization records.',
};
