import { useState } from 'react';
import { ChartBar, DownloadSimple, FileCsv, ShieldCheck } from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Flash } from '../components/ui/Flash';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { useService, useSession } from '../hooks/useService';
import { exportReport } from '../services';
import type { ReportKey } from '../types';

const PAGE_SIZE = 12;

/**
 * Reports.
 *
 * The buttons here were dead. Each definition now builds real rows from the
 * service collections, previews them, and exports CSV — recording the export on
 * the audit trail the way `User.php` logged its `*ExcelFile` runs.
 */
export function ReportsPage() {
  const service = useService();
  const { allowed } = useSession();

  const definitions = service.reports.definitions;
  const [active, setActive] = useState<ReportKey>(definitions[0].key);
  const [page, setPage] = useState(1);
  const [flash, setFlash] = useState<{ tone: 'success' | 'info'; text: string } | null>(null);

  const result = service.reports.build(active);
  const rows = result.rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const select = (key: ReportKey) => {
    setActive(key);
    setPage(1);
  };

  const runExport = () => {
    const built = exportReport(active);
    setFlash({
      tone: 'success',
      text: `${built.definition.title} exported with ${built.rows.length} row(s). The export is on the audit trail.`,
    });
  };

  return (
    <div className="space-y-7">
      <PageHeader
        kicker="Reporting"
        title="Reports & dashboards"
        description="Every report is built from the same collections the desks write to, so a preview can never disagree with the registry."
        actions={
          allowed('reports.export') && (
            <Button icon={<DownloadSimple size={17} />} onClick={runExport}>
              Export CSV
            </Button>
          )
        }
      />

      {flash && <Flash tone={flash.tone} text={flash.text} onDismiss={() => setFlash(null)} />}

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Reports available" value={String(definitions.length)} />
        <Kpi label="Rows in view" value={String(result.rows.length)} />
        <Kpi label="Format" value="CSV" />
        <Kpi label="Legacy source" value={result.definition.legacySource.split('·')[0].trim()} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {definitions.map((definition) => {
          const isActive = definition.key === active;
          const count = service.reports.build(definition.key).rows.length;
          return (
            <button
              key={definition.key}
              type="button"
              onClick={() => select(definition.key)}
              className={`focus-ring rounded-2xl border p-5 text-left transition ${
                isActive
                  ? 'border-[var(--rr-accent)] bg-accent-soft'
                  : 'border-base bg-[var(--rr-surface)] hover:border-[var(--rr-accent)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`rounded-lg p-2 ${isActive ? 'text-accent' : 'muted'}`}>
                  <ChartBar size={18} />
                </span>
                <Badge tone={count > 0 ? 'info' : 'neutral'}>{count} rows</Badge>
              </div>
              <p className="mt-4 text-sm font-semibold">{definition.title}</p>
              <p className="muted mt-2 text-xs leading-5">{definition.description}</p>
            </button>
          );
        })}
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base p-5">
          <div>
            <p className="text-sm font-semibold">{result.definition.title}</p>
            <p className="muted mt-1 text-xs">
              Generated {result.generatedAt} · {result.definition.legacySource}
            </p>
          </div>
          <Badge tone="neutral">
            <FileCsv size={13} /> RFC 4180 CSV
          </Badge>
        </div>

        {result.rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No rows for this report"
              description="Issue or return a file, or run a digitization review, and the data will appear here."
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[var(--rr-bg)] text-xs uppercase tracking-wider muted">
                  <tr>
                    {result.columns.map((column) => (
                      <th key={column} className="whitespace-nowrap px-5 py-3">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--rr-border)]">
                  {rows.map((row, index) => (
                    <tr key={`${row[0]}-${index}`} className="hover:bg-[var(--rr-bg)]">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`${cell}-${cellIndex}`}
                          className={`whitespace-nowrap px-5 py-3 text-xs ${cellIndex === 0 ? 'font-mono font-semibold text-accent' : ''}`}
                        >
                          {cell === '' ? '—' : String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={result.rows.length}
              label="rows"
              onPage={setPage}
            />
          </>
        )}
      </Card>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-accent" />
            <div>
              <p className="text-sm font-semibold">Report governance</p>
              <p className="muted mt-1 text-xs leading-6">
                CSV is emitted first because it needs no dependency and opens in Excel. The .NET 10
                reports worker will serve real <span className="font-mono">.xlsx</span> from the
                same definitions, with the caller&apos;s data scope applied and an audit event per
                run.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="muted text-[10px] uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Card>
  );
}
