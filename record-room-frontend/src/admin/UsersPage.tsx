import { useState } from 'react';
import { Check, Plus, ShieldCheck, Trash, UserCircle } from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Field, SelectInput, TextInput } from '../components/ui/Field';
import { Flash, StatusBadge } from '../components/ui/Flash';
import { EmptyState } from '../components/ui/EmptyState';
import { useQuery, useService, useSession } from '../hooks/useService';
import { ROLE_DESCRIPTIONS } from '../services/permissions';
import { PERMISSIONS } from '../services/permissions';
import { can } from '../services/permissions';
import type { Page } from '../services/contracts';
import type { AppUser, Employee, Role } from '../types';

const EMPTY: Page<Employee> = { items: [], total: 0, page: 1, pageSize: 100 };

/**
 * `drm_login` administration with the permission matrix shown inline, so an
 * administrator can see exactly what each legacy role grants.
 */
export function UsersPage() {
  const service = useService();
  const { allowed } = useSession();

  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  // Three independent reads: the login table, the employee master it links to,
  // and the role list the permission matrix is drawn from.
  const {
    data: users,
    loading,
    reload,
  } = useQuery(() => service.users.list(), [], [] as AppUser[]);
  const { data: employeePage } = useQuery(
    () => service.employees.list({ pageSize: 100 }),
    [],
    EMPTY,
  );
  const { data: roles } = useQuery(() => service.users.roles(), [], [] as Role[]);

  const employees = employeePage.items;
  const target = users.find((user) => user.id === editing) ?? null;

  const remove = async (id: string) => {
    const result = await service.users.remove(id);
    setFlash(
      result.ok
        ? { tone: 'success', text: 'Login removed.' }
        : { tone: 'danger', text: result.error },
    );
    if (result.ok) reload();
  };

  const toggleActive = async (id: string) => {
    const user = users.find((item) => item.id === id);
    if (!user) return;
    const result = await service.users.update(id, { active: !user.active });
    setFlash(
      result.ok
        ? {
            tone: 'success',
            text: `${user.displayName} is now ${result.value.active ? 'active' : 'deactivated'}.`,
          }
        : { tone: 'danger', text: result.error },
    );
    if (result.ok) reload();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Users & roles"
        description="Logins, roles and the permission each role grants. Roles come from the legacy drm_employee.role codes: 1 Supervisor, 2 Operator, 3 Employee, plus Admin."
        actions={
          allowed('users.edit') && (
            <Button icon={<Plus size={17} />} onClick={() => setCreating(true)}>
              Add login
            </Button>
          )
        }
      />

      {flash && <Flash tone={flash.tone} text={flash.text} onDismiss={() => setFlash(null)} />}

      <Card padding={false} className="overflow-hidden">
        {users.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={loading ? 'Loading logins' : 'No logins'}
              description={
                loading ? 'Asking for the login table.' : 'Add a login to give someone access.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-[var(--rr-bg)] text-xs uppercase tracking-wider muted">
                <tr>
                  <th className="px-5 py-3">Login</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">State</th>
                  <th className="px-5 py-3">Last login</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rr-border)]">
                {users.map((user) => {
                  const employee = employees.find(
                    (item) => item.employeeCode === user.employeeCode,
                  );
                  return (
                    <tr key={user.id} className="hover:bg-[var(--rr-bg)]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <UserCircle size={20} className="text-accent" />
                          <div>
                            <p className="font-mono text-sm font-semibold">{user.userName}</p>
                            <p className="muted text-xs">{user.displayName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone="info">{user.role}</Badge>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {employee ? `${employee.name} · ${employee.department}` : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={user.active ? 'Active' : 'Inactive'} />
                      </td>
                      <td className="px-5 py-4 text-xs muted">{user.lastLoginAt}</td>
                      <td className="px-5 py-4">
                        {allowed('users.edit') && (
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setEditing(user.id)}>
                              Edit
                            </Button>
                            <Button variant="ghost" onClick={() => toggleActive(user.id)}>
                              {user.active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => remove(user.id)}
                              aria-label={`Remove ${user.userName}`}
                              icon={<Trash size={15} />}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-5 flex items-center gap-2">
          <ShieldCheck size={19} className="text-accent" />
          <p className="text-sm font-semibold">Permission matrix</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="text-[10px] uppercase tracking-wider muted">
              <tr>
                <th className="py-2 pr-4">Capability</th>
                {roles.map((role) => (
                  <th key={role} className="px-3 py-2 text-center">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rr-border)]">
              {PERMISSIONS.map((permission) => (
                <tr key={permission}>
                  <td className="py-2 pr-4 font-mono">{permission}</td>
                  {roles.map((role) => (
                    <td key={role} className="px-3 py-2 text-center">
                      {can(role as Role, permission) ? (
                        <Check
                          size={14}
                          weight="bold"
                          className="inline text-[var(--rr-success)]"
                          aria-label="granted"
                        />
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {roles.map((role) => (
            <div key={role} className="rounded-xl bg-[var(--rr-bg)] p-4">
              <p className="text-sm font-semibold">{role}</p>
              <p className="muted mt-1.5 text-xs leading-5">{ROLE_DESCRIPTIONS[role]}</p>
            </div>
          ))}
        </div>
        <p className="muted mt-4 text-xs leading-6">
          This matrix hides controls only. The planned .NET 10 API must enforce every one of these
          checks server-side on each request.
        </p>
      </Card>

      <Modal open={creating} onClose={() => setCreating(false)} title="Add login">
        <UserForm
          employees={employees.map((item) => ({ code: item.employeeCode, name: item.name }))}
          roles={roles}
          onSubmit={async (input) => {
            const result = await service.users.create(input);
            if (!result.ok) {
              setFlash({ tone: 'danger', text: result.error });
              return;
            }
            setCreating(false);
            setFlash({ tone: 'success', text: `Login created for ${result.value.displayName}.` });
            reload();
          }}
        />
      </Modal>

      <Modal open={Boolean(target)} onClose={() => setEditing(null)} title="Edit login">
        {target && (
          <UserForm
            initial={{
              userName: target.userName,
              displayName: target.displayName,
              role: target.role,
              employeeCode: target.employeeCode ?? '',
              active: target.active,
              password: '',
            }}
            employees={employees.map((item) => ({ code: item.employeeCode, name: item.name }))}
            roles={roles}
            onSubmit={async ({ password, ...input }) => {
              // An existing login keeps its password; the API ignores it on update.
              void password;
              const result = await service.users.update(target.id, input);
              if (!result.ok) {
                setFlash({ tone: 'danger', text: result.error });
                return;
              }
              setEditing(null);
              setFlash({ tone: 'success', text: `${result.value.displayName} updated.` });
              reload();
            }}
          />
        )}
      </Modal>
    </div>
  );
}

interface UserFormValue {
  userName: string;
  displayName: string;
  role: Role;
  employeeCode: string;
  active: boolean;
  /** Write-only. Only sent when creating a login; never returned by the API. */
  password: string;
}

function UserForm({
  initial,
  employees,
  roles,
  onSubmit,
}: {
  initial?: UserFormValue;
  employees: Array<{ code: string; name: string }>;
  roles: Role[];
  onSubmit: (value: UserFormValue) => void;
}) {
  const [value, setValue] = useState<UserFormValue>(
    initial
      ? { ...initial, password: '' }
      : {
          userName: '',
          displayName: '',
          role: 'Operator',
          employeeCode: '',
          active: true,
          password: '',
        },
  );

  // An existing login already has a password; only a new one needs one.
  const needsPassword = !initial;

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
    >
      <Field
        label="User name"
        htmlFor="user-name"
        required
        hint="3–32 characters: letters, digits, dot, dash, underscore."
      >
        <TextInput
          id="user-name"
          value={value.userName}
          onChange={(event) => setValue((v) => ({ ...v, userName: event.target.value }))}
          className="font-mono"
        />
      </Field>
      <Field label="Display name" htmlFor="user-display" required>
        <TextInput
          id="user-display"
          value={value.displayName}
          onChange={(event) => setValue((v) => ({ ...v, displayName: event.target.value }))}
        />
      </Field>
      <Field label="Role" htmlFor="user-role" required>
        <SelectInput
          id="user-role"
          value={value.role}
          onChange={(event) => setValue((v) => ({ ...v, role: event.target.value as Role }))}
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field
        label="Linked employee"
        htmlFor="user-employee"
        hint="Optional. Links the login to drm_employee."
      >
        <SelectInput
          id="user-employee"
          value={value.employeeCode}
          onChange={(event) => setValue((v) => ({ ...v, employeeCode: event.target.value }))}
        >
          <option value="">Not linked</option>
          {employees.map((employee) => (
            <option key={employee.code} value={employee.code}>
              {employee.code} · {employee.name}
            </option>
          ))}
        </SelectInput>
      </Field>
      {needsPassword && (
        <Field
          label="Initial password"
          htmlFor="user-password"
          required
          hint="Write-only. Sent once on create and never returned by the API."
        >
          <TextInput
            id="user-password"
            type="password"
            value={value.password}
            onChange={(event) => setValue((v) => ({ ...v, password: event.target.value }))}
            className="font-mono"
          />
        </Field>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-[var(--rr-accent)]"
          checked={value.active}
          onChange={(event) => setValue((v) => ({ ...v, active: event.target.checked }))}
        />
        Active
      </label>
      <div className="flex gap-2 pt-1">
        <Button type="submit">Save login</Button>
      </div>
    </form>
  );
}
