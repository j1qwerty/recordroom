import { useState } from 'react';
import { DownloadSimple, Funnel, MagnifyingGlass, Plus, UploadSimple } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { LinkButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SelectInput, TextInput } from '../components/ui/Field';
import { Pagination } from '../components/ui/Pagination';
import { StatusBadge } from '../components/ui/Flash';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { useQuery, useService, useSession } from '../hooks/useService';
import { downloadCsv, toCsv } from '../lib/csv';
import type { FileStatus, RecordFile } from '../types';
import type { FileQuery, Page } from '../services/contracts';
import { formatNumber } from '../lib/utils';

/**
 * Legacy collection size. The API reports its own figure via `collectionTotal`;
 * this is the fallback for the in-memory adapter, which has no honest number to
 * give and would otherwise imply it holds every record.
 */
const REGISTRY_TOTAL = 2_478_450;

const STATUSES: Array<FileStatus | 'All'> = [
  'All',
  'Available',
  'Issued',
  'Under Digitization',
  'Missing',
  'Archived',
];

const EMPTY: Page<RecordFile> = { items: [], total: 0, page: 1, pageSize: 10 };

export function FilesPage() {
  const service = useService();
  const { allowed } = useSession();

  const [query, setQuery] = useState<FileQuery>({
    status: 'All',
    department: 'All',
    sort: 'fileNumber',
    direction: 'asc',
    page: 1,
    pageSize: 10,
  });

  // The API filters, sorts and pages. Re-running on every keystroke is what the
  // old synchronous filter did too, so the typing experience is unchanged.
  const { data: result, loading } = useQuery(() => service.files.list(query), [query], EMPTY);
  const { data: departments } = useQuery(() => service.files.departments(), [], [] as string[]);

  // The API reports the true collection size; the local adapter cannot, so the
  // label falls back to the figure the registry has always claimed.
  const collectionTotal = result.collectionTotal ?? REGISTRY_TOTAL;

  const patch = (next: Partial<FileQuery>) =>
    setQuery((current) => ({ ...current, ...next, page: next.page ?? 1 }));

  const exportCsv = () => {
    const columns = [
      'Barcode',
      'Number',
      'Subject',
      'Department',
      'Year',
      'Status',
      'Shelf',
      'Shelf barcode',
      'Last movement',
    ];
    const rows = result.items.map((file) => [
      file.fileBarcode,
      file.fileNumber,
      file.subject,
      file.department,
      file.year,
      file.status,
      file.shelf,
      file.shelfBarcode,
      file.lastMovement,
    ]);
    downloadCsv(`file-registry-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(columns, rows));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Registry"
        title="Files"
        description="Searchable physical-file master data with stable RF identifiers and mutable location state."
        actions={
          <>
            {allowed('files.bulkImport') && (
              <LinkButton to="/admin/bulk-import" variant="ghost" icon={<UploadSimple size={17} />}>
                Bulk import
              </LinkButton>
            )}
            {allowed('files.create') && (
              <LinkButton to="/files/new" icon={<Plus size={17} />}>
                Create file
              </LinkButton>
            )}
          </>
        }
      />

      <Card padding={false} className="overflow-hidden">
        <div className="grid gap-3 border-b border-base p-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="relative">
            <MagnifyingGlass
              className="muted absolute left-3.5 top-1/2 -translate-y-1/2"
              size={17}
            />
            <TextInput
              value={query.search ?? ''}
              onChange={(event) => patch({ search: event.target.value })}
              placeholder="Barcode, number, subject, holder, area…"
              className="pl-10"
              aria-label="Search files"
            />
          </div>
          <SelectInput
            value={query.department ?? 'All'}
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
            value={query.status ?? 'All'}
            onChange={(event) => patch({ status: event.target.value as FileStatus | 'All' })}
            aria-label="Filter by status"
          >
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item === 'All' ? 'All statuses' : item}
              </option>
            ))}
          </SelectInput>
          <div className="flex gap-2">
            <SelectInput
              value={query.sort ?? 'fileNumber'}
              onChange={(event) => patch({ sort: event.target.value as FileQuery['sort'] })}
              aria-label="Sort by"
              className="flex-1"
            >
              <option value="fileNumber">File number</option>
              <option value="subject">Subject</option>
              <option value="year">Year</option>
              <option value="department">Department</option>
              <option value="lastMovement">Last movement</option>
              <option value="shelf">Shelf</option>
            </SelectInput>
            <Button
              variant="ghost"
              onClick={() => patch({ direction: query.direction === 'asc' ? 'desc' : 'asc' })}
              icon={<Funnel size={16} />}
              aria-label={`Sort ${query.direction === 'asc' ? 'descending' : 'ascending'}`}
            >
              {query.direction === 'asc' ? 'A–Z' : 'Z–A'}
            </Button>
          </div>
        </div>

        {result.items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={loading ? 'Loading files' : 'No files match those filters'}
              description={
                loading
                  ? 'Asking the registry for the matching rows.'
                  : 'Widen the search or clear a filter. The full registry holds far more rows than one page can show.'
              }
              action={
                loading ? undefined : (
                  <Button
                    variant="ghost"
                    onClick={() => patch({ search: '', department: 'All', status: 'All' })}
                  >
                    Clear filters
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-[var(--rr-bg)] text-xs uppercase tracking-wider muted">
                <tr>
                  <th className="px-5 py-3">File</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Year</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Last movement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rr-border)]">
                {result.items.map((file) => (
                  <tr key={file.id} className="hover:bg-[var(--rr-bg)]">
                    <td className="px-5 py-4">
                      <Link to={`/files/${file.id}`} className="font-semibold hover:text-accent">
                        {file.fileNumber}
                      </Link>
                      <div className="mt-1 font-mono text-[10px] muted">{file.fileBarcode}</div>
                      <div className="mt-2 max-w-sm text-xs muted">{file.subject}</div>
                    </td>
                    <td className="px-5 py-4">{file.department}</td>
                    <td className="px-5 py-4">{file.year}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={file.status} />
                    </td>
                    <td className="px-5 py-4 text-xs">{file.location}</td>
                    <td className="px-5 py-4 text-xs muted">{file.lastMovement}</td>
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
          collectionTotal={collectionTotal}
          onPage={(page) => patch({ page })}
          onPageSize={(pageSize) => patch({ pageSize })}
        />
      </Card>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">What this page is showing</p>
            <p className="muted mt-1 text-sm leading-6">
              Showing {formatNumber(result.total)} matching row{result.total === 1 ? '' : 's'} out
              of {formatNumber(collectionTotal)} files. Filtering, sorting and paging all happen in
              the API, so this window is exactly what the registry returned.
            </p>
          </div>
          <Button variant="ghost" onClick={exportCsv} icon={<DownloadSimple size={17} />}>
            Export loaded rows
          </Button>
        </div>
      </Card>
    </div>
  );
}
