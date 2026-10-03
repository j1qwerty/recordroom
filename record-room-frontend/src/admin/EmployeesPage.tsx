import { useState } from 'react';
import {
  IdentificationCard,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Trash,
} from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Field, FormGrid, SelectInput, TextInput } from '../components/ui/Field';
import { Flash, StatusBadge } from '../components/ui/Flash';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { useService, useSession } from '../hooks/useService';
import type { Employee, EmployeeStatus, Role } from '../types';

const STATUSES: Array<EmployeeStatus | 'All'> = ['All', 'Active', 'Inactive', 'Retired'];
const ROLES: Role[] = ['Admin', 'Supervisor', 'Operator', 'Employee'];

type FormValue = Omit<Employee, 'id' | 'createdAt' | 'modifiedAt' | 'status'> & {
  status: EmployeeStatus;
};

/**
 * `drm_employee` registry (legacy `User.php: employee`).
 *
 * Employee codes drive the digitization folder paths, so a code change also
 * re-points the batch display names inside the same write.
 */
export function EmployeesPage() {
  const service = useService();
  const { allowed } = useSession();

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [status, setStatus] = useState<EmployeeStatus | 'All'>('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  const result = service.employees.list({ search, department, status, page, pageSize });
  const departments = service.employees.departments();

  const patch = (next: {
    search?: string;
    department?: string;
    status?: EmployeeStatus | 'All';
  }) => {
    if (next.search !== undefined) setSearch(next.search);
    if (next.department !== undefined) setDepartment(next.department);
    if (next.status !== undefined) setStatus(next.status);
    setPage(1);
  };

  const remove = (employee: Employee) => {
    const outcome = service.employees.remove(employee.id);
    setFlash(
      outcome.ok
        ? { tone: 'success', text: `${employee.employeeCode} removed.` }
        : { tone: 'danger', text: outcome.error },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Employees"
        description="The employee master that digitization batches, issue receipts and walk-in borrower codes all reference."
        actions={
          allowed('employees.edit') && (
            <Button icon={<Plus size={17} />} onClick={() => setCreating(true)}>
              Add employee
            </Button>
          )
        }
      />

      {flash && <Flash tone={flash.tone} text={flash.text} onDismiss={() => setFlash(null)} />}

      <Card padding={false} className="overflow-hidden">
        <div className="grid gap-3 border-b border-base p-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="relative">
            <MagnifyingGlass
              className="muted absolute left-3.5 top-1/2 -translate-y-1/2"
              size={17}
            />
            <TextInput
              value={search}
              onChange={(event) => patch({ search: event.target.value })}
              placeholder="Code, name, mobile, designationâ€¦"
              className="pl-10"
              aria-label="Search employees"
            />
          </div>
          <SelectInput
            value={department}
            onChange={(event) => patch({ department: event.target.value })}
            aria-label="Filter by department"
          >
            <option value="All">All departments</option>
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            value={status}
            onChange={(event) => patch({ status: event.target.value as EmployeeStatus | 'All' })}
            aria-label="Filter by status"
          >
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item === 'All' ? 'All statuses' : item}
              </option>
            ))}
          </SelectInput>
        </div>

        {result.items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No employees match"
              description="Clear the filters or add a new employee record."
              action={
                <Button
                  variant="ghost"
                  onClick={() => patch({ search: '', department: 'All', status: 'All' })}
                >
                  Clear filters
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left text-sm">
              <thead className="bg-[var(--rr-bg)] text-xs uppercase tracking-wider muted">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Designation</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">State</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rr-border)]">
                {result.items.map((employee) => (
                  <tr key={employee.id} className="hover:bg-[var(--rr-bg)]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <IdentificationCard size={20} className="text-accent" />
                        <div>
                          <p className="font-semibold">{employee.name}</p>
                          <p className="muted font-mono text-[11px]">{employee.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">{employee.department}</td>
                    <td className="px-5 py-4 text-xs">{employee.designation}</td>
                    <td className="px-5 py-4 text-xs muted">
                      <p className="font-mono">{employee.mobile}</p>
                      <p>{employee.email}</p>
                    </td>
                    <td className="px-5 py-4 text-xs">{employee.role}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={employee.status} />
                    </td>
                    <td className="px-5 py-4">
                      {allowed('employees.edit') && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => setEditing(employee)}
                            aria-label={`Edit ${employee.employeeCode}`}
                            icon={<PencilSimple size={15} />}
                          />
                          <Button
                            variant="ghost"
                            onClick={() => remove(employee)}
                            aria-label={`Remove ${employee.employeeCode}`}
                            icon={<Trash size={15} />}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          label="employees"
          onPage={setPage}
          onPageSize={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </Card>

      <Modal open={creating} onClose={() => setCreating(false)} title="Add employee">
        <EmployeeForm
          onSubmit={(value) => {
            const outcome = service.employees.create(value);
            if (!outcome.ok) {
              setFlash({ tone: 'danger', text: outcome.error });
              return;
            }
            setCreating(false);
            setFlash({ tone: 'success', text: `${outcome.value.employeeCode} registered.` });
          }}
        />
      </Modal>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit employee">
        {editing && (
          <EmployeeForm
            initial={editing}
            onSubmit={(value) => {
              const outcome = service.employees.update(editing.id, value);
              if (!outcome.ok) {
                setFlash({ tone: 'danger', text: outcome.error });
                return;
              }
              setEditing(null);
              setFlash({ tone: 'success', text: `${outcome.value.employeeCode} updated.` });
            }}
          />
        )}
      </Modal>
    </div>
  );
}

const empty: FormValue = {
  employeeCode: '',
  prefix: 'LK',
  name: '',
  fatherName: '',
  gender: 'Male',
  dateOfBirth: '',
  department: '',
  designation: '',
  email: '',
  mobile: '',
  pan: '',
  aadhaar: '',
  role: 'Employee',
  gradePay: '',
  payScale: '',
  status: 'Active',
};

function EmployeeForm({
  initial,
  onSubmit,
}: {
  initial?: Employee;
  onSubmit: (value: FormValue) => void;
}) {
  const [value, setValue] = useState<FormValue>(initial ?? empty);
  const set = <K extends keyof FormValue>(key: K, next: FormValue[K]) =>
    setValue((current) => ({ ...current, [key]: next }));

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
    >
      <FormGrid>
        <Field
          label="Employee code"
          htmlFor="emp-code"
          required
          hint="Drives the uploads/<code>/ folder path."
        >
          <TextInput
            id="emp-code"
            value={value.employeeCode}
            onChange={(event) => set('employeeCode', event.target.value)}
            className="font-mono"
            placeholder="EMP0009"
          />
        </Field>
        <Field label="Prefix" htmlFor="emp-prefix">
          <TextInput
            id="emp-prefix"
            value={value.prefix}
            onChange={(event) => set('prefix', event.target.value)}
          />
        </Field>
        <Field label="Name" htmlFor="emp-name" required>
          <TextInput
            id="emp-name"
            value={value.name}
            onChange={(event) => set('name', event.target.value)}
          />
        </Field>
        <Field label="Father name" htmlFor="emp-father">
          <TextInput
            id="emp-father"
            value={value.fatherName}
            onChange={(event) => set('fatherName', event.target.value)}
          />
        </Field>
        <Field label="Gender" htmlFor="emp-gender">
          <SelectInput
            id="emp-gender"
            value={value.gender}
            onChange={(event) => set('gender', event.target.value as FormValue['gender'])}
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </SelectInput>
        </Field>
        <Field label="Date of birth" htmlFor="emp-dob">
          <TextInput
            id="emp-dob"
            type="date"
            value={value.dateOfBirth}
            onChange={(event) => set('dateOfBirth', event.target.value)}
          />
        </Field>
        <Field label="Department" htmlFor="emp-dept">
          <TextInput
            id="emp-dept"
            value={value.department}
            onChange={(event) => set('department', event.target.value)}
          />
        </Field>
        <Field label="Designation" htmlFor="emp-designation">
          <TextInput
            id="emp-designation"
            value={value.designation}
            onChange={(event) => set('designation', event.target.value)}
          />
        </Field>
        <Field label="Mobile" htmlFor="emp-mobile" hint="10 digits.">
          <TextInput
            id="emp-mobile"
            value={value.mobile}
            onChange={(event) => set('mobile', event.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label="Email" htmlFor="emp-email">
          <TextInput
            id="emp-email"
            type="email"
            value={value.email}
            onChange={(event) => set('email', event.target.value)}
          />
        </Field>
        <Field label="PAN" htmlFor="emp-pan">
          <TextInput
            id="emp-pan"
            value={value.pan}
            onChange={(event) => set('pan', event.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label="Aadhaar" htmlFor="emp-aadhaar">
          <TextInput
            id="emp-aadhaar"
            value={value.aadhaar}
            onChange={(event) => set('aadhaar', event.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label="Role" htmlFor="emp-role">
          <SelectInput
            id="emp-role"
            value={value.role}
            onChange={(event) => set('role', event.target.value as Role)}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Status" htmlFor="emp-status">
          <SelectInput
            id="emp-status"
            value={value.status}
            onChange={(event) => set('status', event.target.value as EmployeeStatus)}
          >
            <option>Active</option>
            <option>Inactive</option>
            <option>Retired</option>
          </SelectInput>
        </Field>
      </FormGrid>
      <Button type="submit">Save employee</Button>
    </form>
  );
}
