import { Plus, ShieldCheck, UserCircle } from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { LinkButton, Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const users = [
  ['R. Kumar', 'Establishment', 'Department User', 'Active'],
  ['Operator 04', 'Record Room', 'Record Room Custodian', 'Active'],
  ['S. Verma', 'Revenue', 'Approving Officer', 'Active'],
  ['A. Singh', 'IT Cell', 'System Administrator', 'Active'],
];
export function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Users & roles"
        description="Separate identity, role and department scope. Production permissions should be policy-based and auditable."
        actions={
          <LinkButton to="/settings" icon={<Plus size={17} />}>
            Add user
          </LinkButton>
        }
      />
      <Card padding={false} className="overflow-hidden">
        <div className="divide-y divide-[var(--rr-border)]">
          {users.map(([name, dept, role, status]) => (
            <div key={name} className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
              <div className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                <UserCircle size={23} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{name}</p>
                <p className="muted mt-1 text-xs">
                  {dept} · {role}
                </p>
              </div>
              <Badge tone="success">{status}</Badge>
              <Button variant="ghost" icon={<ShieldCheck size={16} />}>
                Permissions
              </Button>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <RoleCard name="Record Room Custodian" permissions="Issue · Return · Move · Locate" />
        <RoleCard name="Auditor" permissions="View reports · Audit · Exceptions" />
        <RoleCard name="System Administrator" permissions="All configuration and access" />
      </div>
    </div>
  );
}
function RoleCard({ name, permissions }: { name: string; permissions: string }) {
  return (
    <Card>
      <p className="text-sm font-semibold">{name}</p>
      <p className="muted mt-2 text-xs leading-6">{permissions}</p>
    </Card>
  );
}
