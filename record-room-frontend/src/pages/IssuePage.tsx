import { useState } from 'react';
import {
  Barcode,
  CheckCircle,
  ClipboardText,
  MagnifyingGlass,
  Plus,
  Trash,
  WarningCircle,
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Field, FormGrid, SelectInput, TextInput } from '../components/ui/Field';
import { Flash } from '../components/ui/Flash';
import { EmptyState } from '../components/ui/EmptyState';
import { useQuery, useService, useSession } from '../hooks/useService';
import type { Employee, RecordFile } from '../types';
import type { BorrowerRow, Page } from '../services/contracts';

const EMPTY_EMPLOYEES: Page<Employee> = { items: [], total: 0, page: 1, pageSize: 100 };

/**
 * Scanner-first multi-file issue desk.
 *
 * Reproduces `Record.php: multipleFileIssue/savemultipleissuefile`: scan several
 * files against one requisition, set a due date, and commit a single receipt.
 * Every guard runs in the service so the page only reports the verdict.
 */
export function IssuePage() {
  const service = useService();
  const { allowed } = useSession();

  const [scan, setScan] = useState('');
  const [cart, setCart] = useState<RecordFile[]>([]);
  const [borrowerType, setBorrowerType] = useState<'Employee' | 'Depositor'>('Employee');
  const [employeeCode, setEmployeeCode] = useState('');
  const [depositorCode, setDepositorCode] = useState('');
  const [purpose, setPurpose] = useState('');
  const [dueAt, setDueAt] = useState(defaultDueDate());
  const [remark, setRemark] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [committing, setCommitting] = useState(false);

  // Employees and the borrower roll-up both live in the API now, so they are
  // asked for rather than derived from a local snapshot.
  const { data: employeePage } = useQuery(
    () => service.employees.list({ pageSize: 100, status: 'Active' }),
    [],
    EMPTY_EMPLOYEES,
  );
  const employees = employeePage.items;
  const employee = employees.find((item) => item.employeeCode === employeeCode);

  const { data: nextReceipt, reload: reloadReceipt } = useQuery(
    () => service.issues.nextReceiptNumber(),
    [],
    '…',
  );
  const { data: borrowers, reload: reloadBorrowers } = useQuery(
    () => service.issues.borrowers(),
    [],
    [] as BorrowerRow[],
  );

  // A scan is two round trips (exact barcode, then the search fallback), so it
  // is held while in flight; a USB scanner can fire faster than the API answers.
  const addScan = async (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setScanning(true);
    try {
      const exact = await service.files.byBarcode(value);
      const fallback = exact ? null : await service.files.list({ search: value, pageSize: 1 });
      const file = exact ?? fallback?.items[0];
      if (!file) {
        setError(`Nothing in the registry matches "${value}".`);
        return;
      }
      if (cart.some((item) => item.id === file.id)) {
        setError(`${file.fileBarcode} is already on this receipt.`);
        return;
      }
      if (file.status !== 'Available') {
        setError(`${file.fileBarcode} is ${file.status.toLowerCase()} and cannot be issued.`);
        return;
      }
      setError(null);
      setCart((current) => [...current, file]);
      setScan('');
    } finally {
      setScanning(false);
    }
  };

  const commit = async () => {
    setCommitting(true);
    try {
      const result = await service.issues.issueFiles({
        borrowerType,
        borrowerEmployeeCode: borrowerType === 'Employee' ? employeeCode : depositorCode,
        borrowerName:
          borrowerType === 'Employee' ? (employee?.name ?? '') : 'Court advocate (walk-in)',
        department: borrowerType === 'Employee' ? (employee?.department ?? '') : 'Legal',
        purpose,
        fileIds: cart.map((file) => file.id),
        dueAt,
        remark,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setReceipt(result.value.receiptNumber);
      setError(null);
      setCart([]);
      setPurpose('');
      setRemark('');
      // The written receipt moves the borrower list and the receipt series on.
      reloadReceipt();
      reloadBorrowers();
    } finally {
      setCommitting(false);
    }
  };

  const reset = () => {
    setReceipt(null);
    setCart([]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Physical movement"
        title="Issue desk"
        description="Scan one file or a whole requisition. Several files can go out on a single receipt, which is what the legacy multipleFileIssue flow did."
        actions={
          <Link to="/return" className="focus-ring text-xs font-semibold text-accent">
            Go to return desk
          </Link>
        }
      />

      {!allowed('issue.issue') && (
        <Flash
          tone="info"
          text="Your role can view receipts but not create new ones. The desk stays visible so you can follow what is out."
        />
      )}

      {receipt && (
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              <CheckCircle size={22} weight="fill" className="mt-0.5 text-[var(--rr-success)]" />
              <div>
                <p className="text-sm font-semibold">Receipt {receipt} committed</p>
                <p className="muted mt-1 text-sm leading-6">
                  File statuses flipped to Issued, holders were set, and one movement event per file
                  was written alongside the audit entry.
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={reset}>
              Start another receipt
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-2">
              <Barcode size={19} className="text-accent" />
              <p className="text-sm font-semibold">1. Scan files</p>
            </div>
            <form
              className="mt-5 relative"
              onSubmit={(event) => {
                event.preventDefault();
                void addScan(scan);
              }}
            >
              <MagnifyingGlass
                className="muted absolute left-4 top-1/2 -translate-y-1/2"
                size={18}
              />
              <input
                value={scan}
                onChange={(event) => setScan(event.target.value)}
                autoFocus
                className="focus-ring h-12 w-full rounded-xl border border-base bg-[var(--rr-bg)] pl-11 pr-4 font-mono text-sm outline-none"
                placeholder="Scan RF-0000124587 and press Enter"
                aria-label="Scan file barcode"
              />
            </form>
            <p className="muted mt-2 text-xs">
              A USB scanner types like a keyboard and Enter submits. Scan continuously for a
              multi-file requisition.
            </p>

            <div className="mt-5">
              {cart.length === 0 ? (
                <div className="rounded-xl border border-dashed border-base p-6 text-center">
                  <p className="text-sm font-semibold">No files on this receipt</p>
                  <p className="muted mt-2 text-xs">
                    Scan a barcode to start building the receipt.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {cart.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-base bg-[var(--rr-bg)] p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-semibold text-accent">
                          {file.fileBarcode}
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold">{file.subject}</p>
                        <p className="muted mt-0.5 text-[11px]">{file.location}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setCart((current) => current.filter((item) => item.id !== file.id))
                        }
                        className="focus-ring rounded-lg p-1.5 text-[var(--rr-danger)] hover:bg-[var(--rr-surface-2)]"
                        aria-label={`Remove ${file.fileBarcode}`}
                      >
                        <Trash size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">2. Borrower and terms</p>
              <p className="muted mt-1 text-xs">
                {cart.length} file(s) ready · next receipt{' '}
                <span className="font-mono">{nextReceipt}</span>
              </p>
            </div>
            <ClipboardText size={22} className="text-accent" />
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Borrower type">
              <SelectInput
                value={borrowerType}
                onChange={(event) =>
                  setBorrowerType(event.target.value as 'Employee' | 'Depositor')
                }
              >
                <option value="Employee">Registered employee</option>
                <option value="Depositor">Walk-in depositor</option>
              </SelectInput>
            </Field>

            {borrowerType === 'Employee' ? (
              <Field label="Employee" htmlFor="issue-employee" required>
                <SelectInput
                  id="issue-employee"
                  value={employeeCode}
                  onChange={(event) => setEmployeeCode(event.target.value)}
                >
                  <option value="">Select an employee</option>
                  {employees.map((item) => (
                    <option key={item.id} value={item.employeeCode}>
                      {item.employeeCode} · {item.name} · {item.department}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            ) : (
              <Field
                label="Depositor code"
                htmlFor="issue-depositor"
                required
                hint="Legacy depositor_code, e.g. a mobile or reference number."
              >
                <TextInput
                  id="issue-depositor"
                  value={depositorCode}
                  onChange={(event) => setDepositorCode(event.target.value)}
                  className="font-mono"
                  placeholder="06429800661"
                />
              </Field>
            )}

            <Field
              label="Purpose"
              htmlFor="issue-purpose"
              hint="Shown on the receipt and the movement log."
            >
              <TextInput
                id="issue-purpose"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                placeholder="Pension settlement verification"
              />
            </Field>

            <FormGrid>
              <Field label="Due date" htmlFor="issue-due" required>
                <TextInput
                  id="issue-due"
                  type="date"
                  value={dueAt}
                  onChange={(event) => setDueAt(event.target.value)}
                />
              </Field>
              <Field label="Remark" htmlFor="issue-remark">
                <TextInput
                  id="issue-remark"
                  value={remark}
                  onChange={(event) => setRemark(event.target.value)}
                  placeholder="Optional"
                />
              </Field>
            </FormGrid>

            {error && <Flash tone="danger" text={error} onDismiss={() => setError(null)} />}

            <div className="flex flex-wrap gap-2">
              <Button
                className="flex-1"
                disabled={!allowed('issue.issue') || cart.length === 0 || scanning || committing}
                icon={<CheckCircle size={17} />}
                onClick={() => void commit()}
              >
                {committing ? 'Committing…' : 'Confirm issue'}
              </Button>
              <Button variant="ghost" onClick={() => setCart([])} icon={<Plus size={17} />}>
                Clear list
              </Button>
            </div>

            <div className="rounded-xl bg-accent-soft p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-accent">
                <WarningCircle size={14} /> Guards applied
              </p>
              <ul className="muted mt-2 space-y-1 text-xs leading-6">
                <li>· Barcode must exist in the registry.</li>
                <li>· File must be Available — issued and digitized files are refused.</li>
                <li>· The same barcode cannot appear twice on one receipt.</li>
                <li>· Employee and depositor code are both mandatory.</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <BorrowerPanel rows={borrowers} />
    </div>
  );
}

function BorrowerPanel({ rows }: { rows: BorrowerRow[] }) {
  return (
    <Card padding={false} className="overflow-hidden">
      <div className="border-b border-base p-5">
        <p className="text-sm font-semibold">Open borrower list</p>
        <p className="muted mt-1 text-xs">
          `borrow_list` equivalent — every borrower with files still out, oldest due first.
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="Nothing is out on loan"
            description="Every receipt has been returned in full."
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[var(--rr-bg)] text-xs uppercase tracking-wider muted">
              <tr>
                <th className="px-5 py-3">Borrower</th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Files out</th>
                <th className="px-5 py-3">Oldest due</th>
                <th className="px-5 py-3">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rr-border)]">
              {rows.map((row) => (
                <tr key={row.employeeCode} className="hover:bg-[var(--rr-bg)]">
                  <td className="px-5 py-4 font-semibold">{row.name}</td>
                  <td className="px-5 py-4 font-mono text-xs">{row.employeeCode}</td>
                  <td className="px-5 py-4">{row.department}</td>
                  <td className="px-5 py-4">{row.openFiles}</td>
                  <td className="px-5 py-4 text-xs muted">{row.oldestDue}</td>
                  <td className="px-5 py-4">
                    {row.overdue ? (
                      <Badge tone="danger">Overdue</Badge>
                    ) : (
                      <Badge tone="info">Open</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function defaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
}
