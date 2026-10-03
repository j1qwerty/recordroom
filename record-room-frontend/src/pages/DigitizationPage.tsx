import { useState, type ReactNode } from 'react';
import {
  Archive,
  CheckCircle,
  Clock,
  FolderOpen,
  Plus,
  Scan,
  WarningCircle,
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, LinkButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Field, SelectInput, TextArea, TextInput } from '../components/ui/Field';
import { Flash } from '../components/ui/Flash';
import { EmptyState } from '../components/ui/EmptyState';
import { useService, useSession } from '../hooks/useService';
import { DIGITIZATION_FOLDERS, FOLDER_LABELS, type DigitizationFolder } from '../types';

const STATUS_TONE = {
  'In progress': 'info',
  Submitted: 'warning',
  Approved: 'success',
  'Partially approved': 'warning',
} as const;

/**
 * Employee-linked digitization batches.
 *
 * The legacy screens were per-employee (`uploads/<empcode>/<folder>/`); the
 * previous frontend had three hardcoded waves with no employee link. Batches
 * here belong to a registered employee, carry a folder, and surface the pages
 * that still need review.
 */
export function DigitizationPage() {
  const service = useService();
  const { allowed } = useSession();

  const [search, setSearch] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [folder, setFolder] = useState<DigitizationFolder | 'All'>('All');
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  const batches = service.digitization.batches({ search, employeeCode, folder });
  const employees = service.employees.list({ pageSize: 100 }).items;
  const allPages = batches.flatMap((batch) => batch.pages);
  const pending = service.digitization.pendingReviewCount();

  return (
    <div className="space-y-7">
      <PageHeader
        kicker="Digitization"
        title="Employee scanning batches"
        description="Each batch belongs to a registered employee and one document folder, matching the legacy uploads/<empcode>/<folder>/ layout. Re-scanning a page creates a new version rather than overwriting."
        actions={
          allowed('digitization.upload') && (
            <Button icon={<Plus size={17} />} onClick={() => setCreating(true)}>
              New batch
            </Button>
          )
        }
      />

      {flash && <Flash tone={flash.tone} text={flash.text} onDismiss={() => setFlash(null)} />}

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={<Scan />} label="Pages in view" value={String(allPages.length)} />
        <Metric
          icon={<CheckCircle />}
          label="Approved"
          value={String(allPages.filter((p) => p.status === 'Approved').length)}
        />
        <Metric
          icon={<WarningCircle />}
          label="Rejected"
          value={String(allPages.filter((p) => p.status === 'Rejected').length)}
          tone="warning"
        />
        <Metric
          icon={<Clock />}
          label="Awaiting review"
          value={String(pending)}
          tone={pending > 0 ? 'warning' : 'neutral'}
        />
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="grid gap-3 border-b border-base p-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          <TextInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Batch code, employee, file barcode…"
            aria-label="Search batches"
          />
          <SelectInput
            value={employeeCode}
            onChange={(event) => setEmployeeCode(event.target.value)}
            aria-label="Filter by employee"
          >
            <option value="">All employees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.employeeCode}>
                {employee.employeeCode} · {employee.name}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            value={folder}
            onChange={(event) => setFolder(event.target.value as DigitizationFolder | 'All')}
            aria-label="Filter by folder"
          >
            <option value="All">All folders</option>
            {DIGITIZATION_FOLDERS.map((item) => (
              <option key={item} value={item}>
                {FOLDER_LABELS[item]}
              </option>
            ))}
          </SelectInput>
        </div>

        {batches.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No batches match"
              description="Clear the filters, or open a new batch for an employee."
            />
          </div>
        ) : (
          <ul className="divide-y divide-[var(--rr-border)]">
            {batches.map((batch) => {
              const approved = batch.pages.filter((page) => page.status === 'Approved').length;
              const rejected = batch.pages.filter((page) => page.status === 'Rejected').length;
              const review = batch.pages.filter((page) => page.status === 'Pending review').length;
              return (
                <li key={batch.id} className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-accent">{batch.code}</span>
                        <Badge tone={STATUS_TONE[batch.status]}>{batch.status}</Badge>
                      </div>
                      <p className="mt-2 font-semibold">{batch.employeeName}</p>
                      <p className="muted mt-0.5 text-[11px]">
                        {batch.employeeCode} · {batch.department} · {FOLDER_LABELS[batch.folder]}
                      </p>
                      <p className="muted mt-1 font-mono text-[10px]">
                        {service.digitization.folderPath(batch)}
                      </p>
                    </div>
                    <LinkButton
                      to={`/digitization/${batch.id}`}
                      variant="ghost"
                      icon={<FolderOpen size={16} />}
                    >
                      Open batch
                    </LinkButton>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <Progress label="Approved" value={approved} total={batch.pages.length} />
                    <Progress
                      label="Rejected"
                      value={rejected}
                      total={batch.pages.length}
                      tone="danger"
                    />
                    <Progress
                      label="Pending"
                      value={review}
                      total={batch.pages.length}
                      tone="warning"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">Why versioning matters here</p>
            <p className="muted mt-1 text-sm leading-6">
              A page is keyed by <span className="font-mono">file_barcode + pageno</span>. Uploading
              the same pair again stores the next <span className="font-mono">version</span> and
              marks it for review instead of silently replacing a page that may already be approved.
            </p>
          </div>
          <Link to="/files" className="focus-ring text-xs font-semibold text-accent">
            Open the registry
          </Link>
        </div>
      </Card>

      <Modal open={creating} onClose={() => setCreating(false)} title="New digitization batch">
        <BatchForm
          employees={employees.map((employee) => ({
            code: employee.employeeCode,
            name: employee.name,
            status: employee.status,
          }))}
          onSubmit={(input) => {
            const result = service.digitization.createBatch(input);
            if (!result.ok) {
              setFlash({ tone: 'danger', text: result.error });
              return;
            }
            setCreating(false);
            setFlash({
              tone: 'success',
              text: `${result.value.code} opened for ${result.value.employeeName}.`,
            });
          }}
        />
      </Modal>
    </div>
  );
}

function Progress({
  label,
  value,
  total,
  tone = 'accent',
}: {
  label: string;
  value: number;
  total: number;
  tone?: 'accent' | 'warning' | 'danger';
}) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  const colour =
    tone === 'danger'
      ? 'var(--rr-danger)'
      : tone === 'warning'
        ? 'var(--rr-warning)'
        : 'var(--rr-accent)';
  return (
    <div className="rounded-xl bg-[var(--rr-bg)] p-3">
      <div className="flex justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className="muted">{pct}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[var(--rr-surface-2)]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colour }} />
      </div>
      <p className="muted mt-1 text-[10px]">
        {value} / {total} page(s)
      </p>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: 'neutral' | 'warning';
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div
          className={`rounded-lg p-2 ${tone === 'warning' ? 'text-[var(--rr-warning)]' : 'text-accent'}`}
          style={
            tone === 'warning'
              ? { background: 'color-mix(in srgb, var(--rr-warning) 12%, transparent)' }
              : undefined
          }
        >
          {icon}
        </div>
        <div>
          <p className="muted text-[10px] uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-xl font-semibold">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function BatchForm({
  employees,
  onSubmit,
}: {
  employees: Array<{ code: string; name: string; status: string }>;
  onSubmit: (input: { employeeCode: string; folder: DigitizationFolder; note: string }) => void;
}) {
  const [employeeCode, setEmployeeCode] = useState('');
  const [folder, setFolder] = useState<DigitizationFolder>('service_book');
  const [note, setNote] = useState('');

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ employeeCode, folder, note });
      }}
    >
      <Field label="Employee" htmlFor="batch-employee" required>
        <SelectInput
          id="batch-employee"
          value={employeeCode}
          onChange={(event) => setEmployeeCode(event.target.value)}
        >
          <option value="">Select an employee</option>
          {employees
            .filter((item) => item.status === 'Active')
            .map((item) => (
              <option key={item.code} value={item.code}>
                {item.code} · {item.name}
              </option>
            ))}
        </SelectInput>
      </Field>
      <Field
        label="Document folder"
        htmlFor="batch-folder"
        required
        hint="One open batch per employee and folder."
      >
        <SelectInput
          id="batch-folder"
          value={folder}
          onChange={(event) => setFolder(event.target.value as DigitizationFolder)}
        >
          {DIGITIZATION_FOLDERS.map((item) => (
            <option key={item} value={item}>
              {FOLDER_LABELS[item]}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Note" htmlFor="batch-note">
        <TextArea
          id="batch-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Requisition reference, supervisor note…"
        />
      </Field>
      <Button type="submit" icon={<Archive size={17} />}>
        Open batch
      </Button>
    </form>
  );
}
