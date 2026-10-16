import { useState } from 'react';
import { DownloadSimple, Funnel, MagnifyingGlass, Plus, UploadSimple } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
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
import type { FileStatus, FileType, RecordFile, RecordKind, Room } from '../types';
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
    recordKind: 'All',
    fileType: 'All',
    sort: 'fileNumber',
    direction: 'asc',
    page: 1,
    pageSize: 10,
  });

  // The API filters, sorts and pages. Re-running on every keystroke is what the
  // old synchronous filter did too, so the typing experience is unchanged.
  const { data: result, loading } = useQuery(
    () => service.files.list(query),
    [query],
    EMPTY,
    // Another desk registering or relocating a file changes this list.
    ['files', 'issues'],
  );
  const { data: departments } = useQuery(() => service.files.departments(), [], [] as string[]);
  const { data: rooms } = useQuery(() => service.locations.listRooms(), [], [] as Room[]);
  const sectionOptions = rooms.flatMap((room) => room.sections)
    .filter((section) => !query.roomId || section.roomId === query.roomId);
  const unitOptions = rooms.flatMap((room) => room.storageUnits)
    .filter((unit) => (!query.roomId || unit.roomId === query.roomId) && (!query.sectionId || unit.sectionId === query.sectionId));
  const shelfOptions = unitOptions.flatMap((unit) => {
    const room = rooms.find((item) => item.id === unit.roomId);
    const section = room?.sections.find((item) => item.id === unit.sectionId);
    return unit.shelves.map((shelf) => ({
      ...shelf,
      label: [room?.code, section?.code, unit.code, shelf.code].filter(Boolean).join(' / '),
    }));
  });

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
      'Record kind',
      'Document size',
      'Type',
      'E-office reference',
      'E-office linked',
      'Room',
      'Section',
      'Almirah',
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
      file.recordKind ?? (file.documentSize === 'A0' || file.fileType === 'Map' ? 'Map' : 'File'),
      file.documentSize ?? 'Other',
      file.fileType,
      file.eOfficeReference ?? '',
      file.eOfficeReference?.trim() ? 'Yes' : 'No',
      file.location,
      file.section,
      file.almirah,
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
        description="Search and filter the registry by record kind, document type, room, section, almirah and shelf."
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
        <div className="grid gap-3 border-b border-base p-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <MagnifyingGlass
              className="muted absolute left-3.5 top-1/2 -translate-y-1/2"
              size={17}
            />
            <TextInput
              value={query.search ?? ''}
              onChange={(event) => patch({ search: event.target.value })}
              placeholder="Barcode, number, subject, holder, area or e-office reference…"
              className="pl-10 xl:col-span-2"
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
          <SelectInput
            value={query.recordKind ?? 'All'}
            onChange={(event) => patch({ recordKind: event.target.value as RecordKind | 'All' })}
            aria-label="Filter by record kind"
          >
            <option value="All">All record kinds</option>
            <option value="File">Files</option>
            <option value="Map">Maps</option>
          </SelectInput>
          <SelectInput
            value={query.fileType ?? 'All'}
            onChange={(event) => patch({ fileType: event.target.value as FileType | 'All' })}
            aria-label="Filter by document type"
          >
            <option value="All">All document types</option>
            {(['Letter', 'File', 'Register', 'Map', 'Drawing', 'Report'] as FileType[]).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </SelectInput>
          <SelectInput
            value={query.eOfficeStatus ?? 'All'}
            onChange={(event) => patch({ eOfficeStatus: event.target.value as FileQuery['eOfficeStatus'] })}
            aria-label="Filter by e-office link"
          >
            <option value="All">E-office: all</option>
            <option value="Linked">Linked to e-office</option>
            <option value="Not linked">Not linked to e-office</option>
          </SelectInput>
          <SelectInput
            value={query.roomId ?? ''}
            onChange={(event) => patch({ roomId: event.target.value || undefined, sectionId: undefined, shelfId: undefined })}
            aria-label="Filter by room"
          >
            <option value="">All rooms</option>
            {rooms.map((room) => <option key={room.id} value={room.id}>{room.code} — {room.name}</option>)}
          </SelectInput>
          <SelectInput
            value={query.sectionId ?? ''}
            onChange={(event) => patch({ sectionId: event.target.value || undefined, shelfId: undefined })}
            aria-label="Filter by section"
            disabled={!query.roomId}
          >
            <option value="">All sections</option>
            {sectionOptions.map((section) => <option key={section.id} value={section.id}>{section.code} — {section.name}</option>)}
          </SelectInput>
          <SelectInput
            value={query.shelfId ?? ''}
            onChange={(event) => patch({ shelfId: event.target.value || undefined })}
            aria-label="Filter by shelf"
            disabled={!query.sectionId}
          >
            <option value="">All shelves</option>
            {shelfOptions.map((shelf) => <option key={shelf.id} value={shelf.id}>{shelf.label} · {shelf.barcode}</option>)}
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
                    onClick={() => patch({ search: '', department: 'All', status: 'All', recordKind: 'All', fileType: 'All', eOfficeStatus: 'All', roomId: undefined, sectionId: undefined, shelfId: undefined })}
                  >
                    Clear filters
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="bg-[var(--rr-bg)] text-xs uppercase tracking-wider muted">
                <tr>
                  <th className="px-5 py-3">File</th>
                  <th className="px-5 py-3">Kind / type</th>
                  <th className="px-5 py-3">Size</th>
                  <th className="px-5 py-3">E-office</th>
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
                    <td className="px-5 py-4">
                      {(() => {
                        const kind = file.recordKind ?? (file.documentSize === 'A0' || file.fileType === 'Map' ? 'Map' : 'File');
                        return <div className="space-y-1.5"><Badge tone={kind === 'Map' ? 'info' : 'neutral'}>{kind}</Badge><div className="text-xs muted">{file.fileType}</div></div>;
                      })()}
                    </td>
                    <td className="px-5 py-4 text-xs font-medium">{file.documentSize ?? 'Other'}</td>
                    <td className="px-5 py-4">
                      {file.eOfficeReference?.trim() ? (
                        <div className="space-y-1.5">
                          <Badge tone="success">Linked</Badge>
                          <p className="max-w-48 break-all font-mono text-[11px]">{file.eOfficeReference}</p>
                        </div>
                      ) : <Badge tone="neutral">Not linked</Badge>}
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
