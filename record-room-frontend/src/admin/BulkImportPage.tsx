import { useState } from 'react';
import { CheckCircle, Paperclip, UploadSimple, WarningCircle } from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, TextArea, TextInput } from '../components/ui/Field';
import { Flash } from '../components/ui/Flash';
import { EmptyState } from '../components/ui/EmptyState';
import { useQuery, useService } from '../hooks/useService';
import { downloadCsv, slugify, toCsv } from '../lib/csv';
import type { BulkImportJob, BulkImportRow } from '../types';

const RESULT_TONE: Record<BulkImportRow['result'], 'success' | 'danger' | 'warning' | 'neutral'> = {
  Accepted: 'success',
  'Duplicate barcode': 'warning',
  'Unknown shelf': 'danger',
  'Inactive shelf': 'danger',
  'Invalid row': 'danger',
};

const SAMPLE = `barcode,subject,shelf
RF-0000301005,Village panchayat land record,RM01001SH01
RF-0000301006,Canal maintenance estimate,RM01001SH01
RF-0000124587,Duplicate of an existing row,RM01005SH03
RF-0000301007,Row pointing at a missing shelf,RM09999SH01`;

/**
 * Bulk ingest for the registry.
 *
 * Legacy `bulk_upload` staged renamed folders and `renaming_process` committed
 * them. Here a CSV is validated against the unique barcode index and the shelf
 * barcode table first, and the operator sees every rejected row before
 * committing anything.
 */
export function BulkImportPage() {
  const service = useService();

  const [folder, setFolder] = useState('bulk/Temp00432/');
  const [csv, setCsv] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  const { data: jobs, reload: reloadJobs } = useQuery(
    () => service.bulk.jobs(),
    [],
    [] as BulkImportJob[],
  );
  const { data: job, reload: reloadJob } = useQuery(
    () => (jobId ? service.bulk.job(jobId) : Promise.resolve(null)),
    [jobId],
    null as BulkImportJob | null,
  );

  const validate = async () => {
    const result = await service.bulk.validateCsv(csv, folder);
    if (!result.ok) {
      setFlash({ tone: 'danger', text: result.error });
      return;
    }
    setJobId(result.value.id);
    setFlash({
      tone: result.value.accepted > 0 ? 'success' : 'danger',
      text: `${result.value.rows.length} row(s) validated: ${result.value.accepted} accepted, ${result.value.rejected} rejected.`,
    });
    // Validating stages a job, so it belongs at the top of the import history.
    reloadJobs();
  };

  const commit = async () => {
    if (!job) return;
    const result = await service.bulk.commit(job.id);
    if (!result.ok) {
      setFlash({ tone: 'danger', text: result.error });
      return;
    }
    setFlash({
      tone: 'success',
      text: `Committed ${result.value.accepted} registry row(s) from ${result.value.filename}.`,
    });
    // Committing flips the job status and writes registry rows, so both the
    // open job and the history have to come back from the API.
    reloadJob();
    reloadJobs();
  };

  const exportRows = (rows: BulkImportRow[], name: string) => {
    downloadCsv(
      `${slugify(name)}-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(
        ['Row', 'Barcode', 'Subject', 'Shelf barcode', 'Result', 'Detail'],
        rows.map((row) => [
          row.rowNo,
          row.fileBarcode,
          row.subject,
          row.shelfBarcode,
          row.result,
          row.detail,
        ]),
      ),
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Bulk import"
        description="Validate a staged batch against the registry before committing. Nothing is written until you confirm, and every refusal carries a reason."
      />

      {flash && <Flash tone={flash.tone} text={flash.text} onDismiss={() => setFlash(null)} />}

      <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <Card>
          <div className="flex items-center gap-2">
            <UploadSimple size={19} className="text-accent" />
            <p className="text-sm font-semibold">Stage a batch</p>
          </div>

          <div className="mt-5 space-y-4">
            <Field
              label="Staging folder"
              htmlFor="bulk-folder"
              hint="Legacy layout: bulk/Temp00432/, bulk/Temp00433/."
            >
              <TextInput
                id="bulk-folder"
                value={folder}
                onChange={(event) => setFolder(event.target.value)}
                className="font-mono"
              />
            </Field>

            <Field
              label="CSV rows"
              htmlFor="bulk-csv"
              required
              hint="Header must contain barcode, subject and shelf."
            >
              <TextArea
                id="bulk-csv"
                value={csv}
                onChange={(event) => setCsv(event.target.value)}
                className="min-h-52 font-mono text-xs"
                placeholder={SAMPLE}
              />
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button onClick={validate} icon={<UploadSimple size={17} />}>
                Validate batch
              </Button>
              <Button variant="ghost" onClick={() => setCsv(SAMPLE)}>
                Load sample
              </Button>
              <Button variant="ghost" onClick={() => setCsv('')}>
                Clear
              </Button>
            </div>
          </div>

          <div className="mt-5 flex gap-3 rounded-xl bg-accent-soft p-4">
            <WarningCircle size={17} className="mt-0.5 shrink-0 text-accent" />
            <p className="muted text-xs leading-6">
              Committed rows land in the registry with department{' '}
              <span className="font-mono">Unverified</span> and no area, because a CSV cannot supply
              them. They still count towards shelf occupancy and appear in the movement log.
            </p>
          </div>
        </Card>

        <div className="space-y-5">
          {job ? (
            <Card padding={false} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base p-5">
                <div>
                  <p className="text-sm font-semibold">{job.filename}</p>
                  <p className="muted mt-1 text-xs">
                    {job.folder} Â· {job.createdAt} Â· {job.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => exportRows(job.rows, job.filename)}>
                    Export result
                  </Button>
                  <Button
                    onClick={commit}
                    disabled={job.status === 'Committed' || job.accepted === 0}
                    icon={<CheckCircle size={17} />}
                  >
                    Commit {job.accepted} row(s)
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-[var(--rr-border)] border-b border-base">
                <Stat label="Accepted" value={job.accepted} tone="text-[var(--rr-success)]" />
                <Stat label="Rejected" value={job.rejected} tone="text-[var(--rr-danger)]" />
                <Stat label="Duplicates" value={job.duplicates} tone="text-[var(--rr-warning)]" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-[var(--rr-bg)] text-xs uppercase tracking-wider muted">
                    <tr>
                      <th className="px-5 py-3">Row</th>
                      <th className="px-5 py-3">Barcode</th>
                      <th className="px-5 py-3">Subject</th>
                      <th className="px-5 py-3">Shelf barcode</th>
                      <th className="px-5 py-3">Result</th>
                      <th className="px-5 py-3">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--rr-border)]">
                    {job.rows.map((row) => (
                      <tr key={row.rowNo} className="hover:bg-[var(--rr-bg)]">
                        <td className="px-5 py-3 text-xs muted">{row.rowNo}</td>
                        <td className="px-5 py-3 font-mono text-xs">{row.fileBarcode}</td>
                        <td className="px-5 py-3 text-xs">{row.subject}</td>
                        <td className="px-5 py-3 font-mono text-xs muted">{row.shelfBarcode}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-xs font-semibold ${
                              RESULT_TONE[row.result] === 'success'
                                ? 'text-[var(--rr-success)]'
                                : RESULT_TONE[row.result] === 'warning'
                                  ? 'text-[var(--rr-warning)]'
                                  : 'text-[var(--rr-danger)]'
                            }`}
                          >
                            {row.result}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[11px] muted">{row.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState
                title="No batch staged"
                description="Paste CSV rows on the left and validate them to see a per-row verdict."
              />
            </Card>
          )}

          <Card padding={false} className="overflow-hidden">
            <div className="border-b border-base p-5">
              <p className="text-sm font-semibold">Import history</p>
              <p className="muted mt-1 text-xs">Every validated and committed batch.</p>
            </div>
            {jobs.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Nothing imported yet"
                  description="Committed batches appear here."
                />
              </div>
            ) : (
              <ul className="divide-y divide-[var(--rr-border)]">
                {jobs.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-5"
                  >
                    <div className="flex items-center gap-3">
                      <Paperclip size={18} className="text-accent" />
                      <div>
                        <p className="text-sm font-semibold">{item.filename}</p>
                        <p className="muted mt-0.5 text-[11px]">
                          {item.createdAt} Â· {item.createdBy} Â· {item.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-[var(--rr-success)]">{item.accepted} accepted</span>
                      <span className="text-[var(--rr-danger)]">{item.rejected} rejected</span>
                      <Button variant="ghost" onClick={() => setJobId(item.id)}>
                        Open
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="p-5">
      <p className="muted text-[10px] uppercase tracking-widest">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
