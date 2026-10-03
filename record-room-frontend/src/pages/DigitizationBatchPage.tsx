import { useState, type ReactNode } from 'react';
import { ArrowLeft, CheckCircle, FileText, ThumbsDown, UploadSimple } from '@phosphor-icons/react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Field, TextInput } from '../components/ui/Field';
import { Flash, StatusBadge } from '../components/ui/Flash';
import { EmptyState } from '../components/ui/EmptyState';
import { useQuery, useService, useSession } from '../hooks/useService';
import { FOLDER_LABELS, type DigitizationBatch } from '../types';

/**
 * Batch detail with page-level review.
 *
 * `Employee_reports` in the legacy app let a supervisor approve or reject each
 * `upload_file` row after an OCR quality check, and a rejection always needed a
 * reason. Both rules are enforced in the service, not the form.
 */
export function DigitizationBatchPage() {
  const { batchId } = useParams();
  const service = useService();
  const { allowed } = useSession();

  // The API resolves the batch, so `data` is null until it answers (and stays
  // null for a genuinely unknown id). Every mutation below reloads it.
  const {
    data: batch,
    loading,
    reload,
  } = useQuery(
    () => (batchId ? service.digitization.batch(batchId) : Promise.resolve(null)),
    [batchId],
    null as DigitizationBatch | null,
  );

  const [fileBarcode, setFileBarcode] = useState('');
  const [pageNo, setPageNo] = useState(1);
  const [filename, setFilename] = useState('');
  const [bulk, setBulk] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [flash, setFlash] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  if (!batch) {
    return (
      <div className="space-y-6">
        <Link
          to="/digitization"
          className="inline-flex items-center gap-2 text-xs font-semibold muted"
        >
          <ArrowLeft size={15} /> All batches
        </Link>
        <EmptyState
          title={loading ? 'Loading batch' : 'Batch not found'}
          description={
            loading
              ? 'Asking the digitization register for this batch.'
              : 'That batch id is not in the local dataset. Return to the batch list.'
          }
          action={
            loading ? undefined : (
              <Link to="/digitization" className="focus-ring text-xs font-semibold text-accent">
                Back to batches
              </Link>
            )
          }
        />
      </div>
    );
  }

  const readOnly = batch.status === 'Approved';
  const folderPath = service.digitization.folderPath(batch);

  const upload = async () => {
    const result = await service.digitization.uploadPage(batch.id, {
      fileBarcode: fileBarcode.trim(),
      pageNo,
      filename: filename.trim(),
      bulk,
    });
    if (!result.ok) {
      setFlash({ tone: 'danger', text: result.error });
      return;
    }
    setFlash({
      tone: 'success',
      text: `${result.value.filename} stored as version ${result.value.version}.`,
    });
    setFileBarcode('');
    setFilename('');
    setPageNo(1);
    // The page list, the version counts and the batch status all move.
    reload();
  };

  const review = async (pageId: string, decision: 'Approved' | 'Rejected', note: string) => {
    const result = await service.digitization.reviewPage(pageId, decision, note);
    setFlash(
      result.ok
        ? { tone: 'success', text: `Page ${decision.toLowerCase()}.` }
        : { tone: 'danger', text: result.error },
    );
    setRejectNote('');
    reload();
  };

  const reviewBatch = async (decision: 'Approved' | 'Rejected') => {
    const result = await service.digitization.reviewBatch(batch.id, decision, rejectNote);
    setFlash(
      result.ok
        ? { tone: 'success', text: `Batch now ${result.value.status}.` }
        : { tone: 'danger', text: result.error },
    );
    setRejectNote('');
    reload();
  };

  return (
    <div className="space-y-6">
      <Link
        to="/digitization"
        className="inline-flex items-center gap-2 text-xs font-semibold muted"
      >
        <ArrowLeft size={15} /> All batches
      </Link>

      <PageHeader
        kicker={`${batch.code} · ${FOLDER_LABELS[batch.folder]}`}
        title={`${batch.employeeName} · ${batch.employeeCode}`}
        description={batch.department}
        actions={
          allowed('digitization.review') &&
          !readOnly && (
            <>
              <Button
                variant="ghost"
                icon={<ThumbsDown size={16} />}
                onClick={() => reviewBatch('Rejected')}
              >
                Reject pending
              </Button>
              <Button icon={<CheckCircle size={16} />} onClick={() => reviewBatch('Approved')}>
                Approve pending
              </Button>
            </>
          )
        }
      />

      {flash && <Flash tone={flash.tone} text={flash.text} onDismiss={() => setFlash(null)} />}

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Status" value={<StatusBadge status={batch.status} />} />
        <Stat label="Pages" value={String(batch.pages.length)} />
        <Stat
          label="Approved"
          value={String(batch.pages.filter((page) => page.status === 'Approved').length)}
        />
        <Stat label="Opened" value={batch.createdAt} />
      </div>

      <Card>
        <p className="muted text-[10px] uppercase tracking-widest">Legacy folder path</p>
        <p className="mt-1 font-mono text-sm font-semibold text-accent">{folderPath}</p>
        <p className="muted mt-2 text-xs leading-6">
          Scans for this batch are stored under the employee code and folder, exactly like the
          legacy <span className="font-mono">uploads/</span> tree.
        </p>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card padding={false} className="overflow-hidden">
          <div className="border-b border-base p-5">
            <p className="text-sm font-semibold">Pages</p>
            <p className="muted mt-1 text-xs">
              {batch.pages.length} page(s) · re-scans create a new version
            </p>
          </div>
          {batch.pages.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No pages uploaded yet"
                description="Add the first scanned page on the right."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-[var(--rr-bg)] text-xs uppercase tracking-wider muted">
                  <tr>
                    <th className="px-5 py-3">Scanned file</th>
                    <th className="px-5 py-3">Page</th>
                    <th className="px-5 py-3">Version</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Note</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--rr-border)]">
                  {batch.pages.map((page) => (
                    <tr key={page.id} className="hover:bg-[var(--rr-bg)]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <FileText size={15} className="muted" />
                          <div>
                            <p className="font-mono text-xs">{page.filename}</p>
                            <p className="muted text-[11px]">{page.fileBarcode}</p>
                          </div>
                        </div>
                        {page.bulk && (
                          <Badge tone="neutral" className="mt-2">
                            bulk import
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs">{page.pageNo}</td>
                      <td className="px-5 py-4">
                        <Badge tone="info">v{page.version}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={page.status} />
                      </td>
                      <td className="px-5 py-4 text-[11px] muted">{page.note || '—'}</td>
                      <td className="px-5 py-4">
                        {allowed('digitization.review') &&
                          !readOnly &&
                          page.status === 'Pending review' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                icon={<CheckCircle size={15} />}
                                onClick={() => review(page.id, 'Approved', '')}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() =>
                                  review(
                                    page.id,
                                    'Rejected',
                                    rejectNote || 'Rejected by supervisor',
                                  )
                                }
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          {allowed('digitization.upload') && !readOnly && (
            <Card>
              <div className="flex items-center gap-2">
                <UploadSimple size={18} className="text-accent" />
                <p className="text-sm font-semibold">Add a scanned page</p>
              </div>
              <div className="mt-4 space-y-4">
                <Field
                  label="Registry barcode"
                  htmlFor="page-barcode"
                  required
                  hint="Must exist in the registry."
                >
                  <TextInput
                    id="page-barcode"
                    value={fileBarcode}
                    onChange={(event) => setFileBarcode(event.target.value)}
                    className="font-mono"
                    placeholder="RF-0000199103"
                  />
                </Field>
                <Field label="Page number" htmlFor="page-no" required>
                  <TextInput
                    id="page-no"
                    type="number"
                    min={1}
                    value={pageNo}
                    onChange={(event) => setPageNo(Number(event.target.value))}
                  />
                </Field>
                <Field
                  label="File name"
                  htmlFor="page-filename"
                  hint="Left blank, a name is derived from the barcode, page and version."
                >
                  <TextInput
                    id="page-filename"
                    value={filename}
                    onChange={(event) => setFilename(event.target.value)}
                    className="font-mono"
                  />
                </Field>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--rr-accent)]"
                    checked={bulk}
                    onChange={(event) => setBulk(event.target.checked)}
                  />
                  Imported from a bulk staging folder
                </label>
                <Button className="w-full" onClick={upload}>
                  Add page
                </Button>
              </div>
            </Card>
          )}

          {allowed('digitization.review') && !readOnly && (
            <Card>
              <p className="text-sm font-semibold">Rejection reason</p>
              <p className="muted mt-1 text-xs">
                Required before a page or batch can be rejected, and stored on the audit trail.
              </p>
              <div className="mt-3">
                <Field label="Reason" htmlFor="reject-note">
                  <TextInput
                    id="reject-note"
                    value={rejectNote}
                    onChange={(event) => setRejectNote(event.target.value)}
                    placeholder="Skew beyond 5 degree tolerance"
                  />
                </Field>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | ReactNode }) {
  return (
    <Card>
      <p className="muted text-[10px] uppercase tracking-wider">{label}</p>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </Card>
  );
}
