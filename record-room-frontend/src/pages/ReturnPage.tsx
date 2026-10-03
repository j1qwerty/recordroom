import { useState } from 'react';
import { CheckCircle, MagnifyingGlass, Package, WarningCircle } from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SelectInput, TextInput } from '../components/ui/Field';
import { Flash, StatusBadge } from '../components/ui/Flash';
import { EmptyState } from '../components/ui/EmptyState';
import { useQuery, useService, useSession } from '../hooks/useService';
import { cn } from '../lib/utils';
import type { IssueRecord, RecordFile } from '../types';
import type { Page } from '../services/contracts';

const CONDITIONS = ['Good', 'Minor damage', 'Torn pages', 'Missing pages', 'Needs repair'];

const EMPTY_OPEN: Page<IssueRecord> = { items: [], total: 0, page: 1, pageSize: 50 };
const EMPTY_FILES: Array<RecordFile | null> = [];

/** A receipt plus the file behind each of its lines, resolved in one read. */
interface ReceiptView {
  record: IssueRecord;
  files: Array<RecordFile | null>;
}

/**
 * Return desk.
 *
 * Reproduces `Record.php: returnfilelist`: pick a receipt, tick the files
 * physically handed back, and record their condition. A receipt can be
 * returned in parts, which the old one-row-per-file table could not represent.
 */
export function ReturnPage() {
  const service = useService();
  const { allowed } = useSession();

  const [receiptId, setReceiptId] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [flash, setFlash] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [returning, setReturning] = useState(false);

  // The open list and the chosen receipt are two separate asks; both are refetched
  // after a write, because returning files changes both answers.
  const { data: openPage, reload: reloadOpen } = useQuery(
    () => service.issues.list({ open: true, pageSize: 50 }),
    [],
    EMPTY_OPEN,
  );
  const open = openPage.items;

  // The receipt and the file behind every line are fetched together, so the
  // list never renders a row whose subject has not arrived yet.
  const {
    data: view,
    loading: receiptLoading,
    reload: reloadReceipt,
  } = useQuery<ReceiptView | null>(
    async () => {
      if (!receiptId) return null;
      const record = await service.issues.get(receiptId);
      if (!record) return null;
      const files = await Promise.all(record.lines.map((line) => service.files.get(line.fileId)));
      return { record, files };
    },
    [receiptId],
    null,
  );

  const receipt = view?.record ?? null;
  const lineFiles = view?.files ?? EMPTY_FILES;

  const toggle = (fileId: string) =>
    setSelected((current) =>
      current.includes(fileId) ? current.filter((id) => id !== fileId) : [...current, fileId],
    );

  const commit = async () => {
    if (!receipt) return;
    setReturning(true);
    try {
      const result = await service.issues.returnFiles(receipt.id, selected, condition);
      if (!result.ok) {
        setFlash({ tone: 'danger', text: result.error });
        return;
      }
      const returned = selected.length;
      setFlash({
        tone: 'success',
        text: `${returned} file(s) returned against ${receipt.receiptNumber}. Receipt is now ${result.value.status}.`,
      });
      setSelected([]);
      reloadReceipt();
      reloadOpen();
    } finally {
      setReturning(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Physical movement"
        title="Return desk"
        description="Close all or part of a receipt. Each returned file goes back to Available, the shelf position is retained, and the movement log records the condition."
      />

      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <Card>
          <div className="flex items-center gap-2">
            <Package size={19} className="text-accent" />
            <p className="text-sm font-semibold">1. Pick a receipt</p>
          </div>
          <div className="mt-5">
            <SelectInput
              value={receiptId}
              onChange={(event) => {
                setReceiptId(event.target.value);
                setSelected([]);
                setFlash(null);
              }}
              aria-label="Select receipt"
            >
              <option value="">Select an open receipt</option>
              {open.map((issue) => (
                <option key={issue.id} value={issue.id}>
                  {issue.receiptNumber} · {issue.borrowerName} · due {issue.dueAt}
                </option>
              ))}
            </SelectInput>
          </div>

          <div className="mt-5">
            <div className="relative">
              <MagnifyingGlass
                className="muted absolute left-4 top-1/2 -translate-y-1/2"
                size={18}
              />
              <TextInput
                value={receiptId}
                onChange={(event) => {
                  const value = event.target.value;
                  setReceiptId(value);
                  setSelected([]);
                  setFlash(null);
                }}
                placeholder="Or type a receipt number"
                className="pl-11 font-mono"
                aria-label="Receipt number"
              />
            </div>
            <p className="muted mt-2 text-xs">
              Typing a barcode returns every file on that receipt.
            </p>
          </div>

          <div className="mt-6 rounded-xl bg-[var(--rr-bg)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] muted">Open receipts</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{open.length}</p>
            <p className="muted mt-1 text-xs">
              {open.reduce(
                (sum, issue) => sum + issue.lines.filter((line) => !line.returnedAt).length,
                0,
              )}{' '}
              file(s) currently out with borrowers.
            </p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">2. Confirm what came back</p>
              <p className="muted mt-1 text-xs">
                {receipt
                  ? `${receipt.lines.length} file(s) on this receipt`
                  : 'Select a receipt first'}
              </p>
            </div>
            {receipt && <StatusBadge status={receipt.status} />}
          </div>

          {!receipt ? (
            <div className="mt-6">
              <EmptyState
                title={receiptLoading ? 'Loading receipt' : 'Waiting for a receipt'}
                description={
                  receiptLoading
                    ? 'Asking the API which files were issued on that receipt.'
                    : 'Choose an open receipt, or type its number, to list the files that were issued.'
                }
              />
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <div className="rounded-xl bg-[var(--rr-bg)] p-4">
                <p className="font-semibold">{receipt.borrowerName}</p>
                <p className="muted mt-1 text-xs">
                  {receipt.borrowerEmployeeCode} · {receipt.department} · due {receipt.dueAt}
                </p>
                {receipt.purpose && (
                  <p className="muted mt-2 text-xs">Purpose: {receipt.purpose}</p>
                )}
              </div>

              <ul className="space-y-2">
                {receipt.lines.map((line, index) => {
                  const file = lineFiles[index];
                  const isBack = line.returnedAt !== null;
                  const checked = selected.includes(line.fileId);
                  return (
                    <li key={line.fileId}>
                      <label
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition',
                          isBack
                            ? 'border-base opacity-60'
                            : checked
                              ? 'border-[var(--rr-accent)] bg-accent-soft'
                              : 'border-base hover:bg-[var(--rr-surface-2)]',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 size-4 accent-[var(--rr-accent)]"
                          checked={isBack || checked}
                          disabled={isBack}
                          onChange={() => toggle(line.fileId)}
                          aria-label={`Return ${line.fileBarcode}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-xs font-semibold text-accent">
                            {line.fileBarcode}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold">
                            {file?.subject ?? 'Unknown file'}
                          </p>
                          <p className="muted mt-0.5 text-[11px]">
                            {isBack ? `Returned ${line.returnedAt}` : file?.location}
                          </p>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>

              <div>
                <SelectInput
                  value={condition}
                  onChange={(event) => setCondition(event.target.value)}
                  aria-label="Condition on return"
                >
                  {CONDITIONS.map((item) => (
                    <option key={item} value={item}>
                      Condition: {item}
                    </option>
                  ))}
                </SelectInput>
              </div>

              {flash && (
                <Flash tone={flash.tone} text={flash.text} onDismiss={() => setFlash(null)} />
              )}

              <Button
                className="w-full"
                disabled={!allowed('issue.return') || selected.length === 0 || returning}
                icon={<CheckCircle size={17} />}
                onClick={() => void commit()}
              >
                {returning ? 'Returning…' : `Return ${selected.length || 'selected'} file(s)`}
              </Button>

              {!allowed('issue.return') && (
                <p className="muted flex items-center gap-2 text-xs">
                  <WarningCircle size={14} /> Your role cannot record returns.
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
