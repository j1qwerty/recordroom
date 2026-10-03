/**
 * `drm_employee` registry.
 *
 * Legacy `User.php: employee` supported list/search/add/edit/delete over the
 * employee table, with `emp_department` and `emp_designation` as the picklists.
 */

import { err, ok, type EmployeeQuery, type EmployeesApi } from '../contracts';
import { newId, store, timestamp } from '../store';
import type { Employee } from '../../types';
import { log } from './audit';

function matchSearch(employee: Employee, needle: string): boolean {
  return [
    employee.employeeCode,
    employee.name,
    employee.fatherName,
    employee.email,
    employee.mobile,
    employee.department,
    employee.designation,
  ]
    .join(' ')
    .toLowerCase()
    .includes(needle);
}

export const employeesService: EmployeesApi = {
  async list(query: EmployeeQuery = {}) {
    const search = query.search?.trim().toLowerCase() ?? '';
    const filtered = store.getState().employees.filter((employee) => {
      if (search && !matchSearch(employee, search)) return false;
      if (
        query.department &&
        query.department !== 'All' &&
        employee.department !== query.department
      ) {
        return false;
      }
      if (query.status && query.status !== 'All' && employee.status !== query.status) return false;
      return true;
    });
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'en-IN'));
    const pageSize = Math.max(1, query.pageSize ?? 10);
    const page = Math.max(1, query.page ?? 1);
    return {
      items: filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  },

  async get(id) {
    return store.getState().employees.find((employee) => employee.id === id) ?? null;
  },

  async byCode(code) {
    const needle = code.trim().toUpperCase();
    if (!needle) return null;
    return (
      store
        .getState()
        .employees.find((employee) => employee.employeeCode.toUpperCase() === needle) ?? null
    );
  },

  async create(input) {
    const code = input.employeeCode.trim().toUpperCase();
    if (!code) return err('Employee code is required.', 'employeeCode');
    if (await employeesService.byCode(code))
      return err(`${code} is already registered.`, 'employeeCode');
    if (!input.name.trim()) return err('Employee name is required.', 'name');
    if (input.mobile && !/^\d{10}$/.test(input.mobile.trim())) {
      return err('Mobile must be 10 digits.', 'mobile');
    }

    const now = timestamp();
    const employee: Employee = {
      ...input,
      id: newId('emp'),
      employeeCode: code,
      name: input.name.trim(),
      createdAt: now,
      modifiedAt: now,
      status: 'Active',
    };

    store.update((draft) => {
      draft.employees.push(employee);
      log(draft, {
        action: 'Create',
        entity: 'Employee',
        entityId: employee.id,
        before: '—',
        after: `${code} · ${employee.name}`,
        summary: `Employee ${code} registered`,
      });
    });
    return ok(employee);
  },

  async update(id, input) {
    const current = await employeesService.get(id);
    if (!current) return err('Employee not found.', 'id');

    if (input.employeeCode && input.employeeCode.trim().toUpperCase() !== current.employeeCode) {
      const clash = await employeesService.byCode(input.employeeCode);
      if (clash)
        return err(
          `${input.employeeCode.trim().toUpperCase()} is already registered.`,
          'employeeCode',
        );
    }
    if (input.mobile && !/^\d{10}$/.test(input.mobile.trim())) {
      return err('Mobile must be 10 digits.', 'mobile');
    }

    const updated: Employee = {
      ...current,
      ...input,
      employeeCode: input.employeeCode?.trim().toUpperCase() ?? current.employeeCode,
      modifiedAt: timestamp(),
    };

    store.update((draft) => {
      const index = draft.employees.findIndex((employee) => employee.id === id);
      if (index < 0) return;
      draft.employees[index] = updated;
      // Keep digitization batches pointing at a live display name.
      draft.batches.forEach((batch) => {
        if (batch.employeeCode === current.employeeCode) {
          batch.employeeName = updated.name;
          batch.department = updated.department;
        }
      });
      log(draft, {
        action: 'Update',
        entity: 'Employee',
        entityId: id,
        before: `${current.employeeCode} · ${current.status}`,
        after: `${updated.employeeCode} · ${updated.status}`,
        summary: `Employee ${updated.employeeCode} updated`,
      });
    });
    return ok(updated);
  },

  async remove(id) {
    const current = await employeesService.get(id);
    if (!current) return err('Employee not found.', 'id');
    const batches = store
      .getState()
      .batches.filter((batch) => batch.employeeCode === current.employeeCode);
    if (batches.length > 0) {
      return err(
        `${batches.length} digitization batch(es) reference this employee. Reassign or delete them first.`,
        'id',
      );
    }
    store.update((draft) => {
      draft.employees = draft.employees.filter((employee) => employee.id !== id);
      log(draft, {
        action: 'Delete',
        entity: 'Employee',
        entityId: id,
        before: `${current.employeeCode} · ${current.name}`,
        after: 'deleted',
        summary: `Employee ${current.employeeCode} removed`,
      });
    });
    return ok(true);
  },

  async departments() {
    return [...new Set(store.getState().employees.map((employee) => employee.department))].sort();
  },
};
