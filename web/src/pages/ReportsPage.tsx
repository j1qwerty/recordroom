import { useEffect, useRef, useState } from 'react';
import { ChartBar, DownloadSimple, FileCsv, ShieldCheck } from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Flash } from '../components/ui/Flash';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { useQuery, useService, useSession } from '../hooks/useService';
import { exportReport } from '../services';
import type { ReportDefinition, ReportKey } from '../types';
import type { ReportResult } from '../services/contracts';

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

  // Definitions are a plain read, so they come through a query. The first paint
  // has none yet, hence the empty seed.
  const { data: definitions } = useQuery(
    () => service.reports.definitions(),
    [],
    [] as ReportDefinition[],
  );

  const [active, setActive] = useState<ReportKey | null>(null);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [flash, setFlash] = useState<{ tone: 'success' | 'info'; text: string } | null>(null);

  /**
   * Builds every definition in one batch.
   *
   * `build` is a user action, not a render-time read: it compiles rows from the
   * whole registry. The card badges want a row count per definition, so building
   * all of them together costs the same round trips as building one and avoids a
   * second pass when the selection changes.
   */
  const loadReports = async (key: ReportKey) => {
    const built = await buildAll(service, definitions);
    setActive(key);
    setPage(1);
    setCounts(Object.fromEntries(built.map((item) => [item.definition.key, item.rows.length])));
    setResult(built.find((item) => item.definition.key === key) ?? null);
  };

  // Nothing is built until the definitions arrive, so the first definition is
  // preselected once. The build is a deliberate async step rather than a
  // `useQuery` dep: it compiles rows from the whole registry, and re-running it
  // because a dep changed would be a full rebuild for no user action.
  const primed = useRef(false);
  useEffect(() => {
    if (definitions.length === 0 || primed.current) return;
    primed.current = true;
    let live = true;
    buildAll(service, definitions).then((built) => {
      if (!live) return;
      const first = built[0];
      if (!first) return;
      setActive(first.definition.key);
      setCounts(Object.fromEntries(built.map((item) => [item.definition.key, item.rows.length])));
      setResult(first);
    });
    return () => {
      live = false;
    };
  }, [service, definitions]);

  const runExport = async () => {
    if (!active) return;
    const built = await exportReport(active);
    setFlash({
      tone: 'success',
      text: `${built.definition.title} exported with ${built.rows.length} row(s). The export is on the audit trail.`,
    });
  };

  const rows = result ? result.rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : [];

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
        <Kpi label="Rows in view" value={String(result?.rows.length ?? 0)} />
        <Kpi label="Format" value="CSV" />
        <Kpi
          label="Legacy source"
          value={result ? result.definition.legacySource.split('·')[0].trim() : '—'}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {definitions.map((definition) => {
          const isActive = definition.key === active;
          const count = counts[definition.key] ?? 0;
          return (
            <button
              key={definition.key}
              type="button"
              onClick={() => void loadReports(definition.key)}
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
            <p className="text-sm font-semibold">{result?.definition.title ?? 'Building report'}</p>
            <p className="muted mt-1 text-xs">
              {result
                ? `Generated ${result.generatedAt} · ${result.definition.legacySource}`
                : 'Compiling rows from the registry collections.'}
            </p>
          </div>
          <Badge tone="neutral">
            <FileCsv size={13} /> RFC 4180 CSV
          </Badge>
        </div>

        {!result ? (
          <div className="p-6">
            <EmptyState
              title="Building the report"
              description="Rows are compiled server-side from the same collections the desks write to."
            />
          </div>
        ) : result.rows.length === 0 ? (
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

/**
 * Builds every definition in one batch.
 *
 * The card badges want a row count per definition, so building them together
 * costs no more round trips than building the one on screen, and the selection
 * is picked straight out of the same batch.
 */
async function buildAll(
  service: ReturnType<typeof useService>,
  definitions: ReportDefinition[],
): Promise<ReportResult[]> {
  return Promise.all(definitions.map((item) => service.reports.build(item.key)));
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="muted text-[10px] uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Card>
  );
}
