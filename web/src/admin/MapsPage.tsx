import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowsClockwise,
  Eye,
  FileImage,
  MagnifyingGlass,
  MapPinPlus,
  Trash,
  UploadSimple,
} from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Flash, StatusBadge } from '../components/ui/Flash';
import { EmptyState } from '../components/ui/EmptyState';
import { DocumentViewer } from '../components/files/DocumentViewer';
import { DropZone } from '../components/files/DropZone';
import { UploadMapModal } from '../components/files/FileActionModals';
import { useFlash, useQuery, useService, useSession } from '../hooks/useService';
import { describePageCount, formatDocumentSize, validateDocumentFile } from '../lib/document';
import type { MapUpload, RecordFile } from '../types';
import type { Page } from '../services/contracts';

const EMPTY_MAPS: MapUpload[] = [];
const EMPTY_FILES: Page<RecordFile> = { items: [], total: 0, page: 1, pageSize: 8 };

/**
 * Scanned maps and file copies.
 *
 * A new scan of the same file and page becomes the next version and retires the
 * previous approval, which is why versions are listed rather than hidden.
 */
export function MapsPage() {
  const service = useService();
  const { allowed } = useSession();
  // Map rows are digitization scans, so reuse that permission. It matches the
  // API's gate on `POST /api/uploads/maps/{id}/document`.
  const canUpload = allowed('digitization.upload') || allowed('files.edit');
  const { flash, success, danger, clear } = useFlash();

  const [search, setSearch] = useState('');
  const [picking, setPicking] = useState(false);
  const [uploadFor, setUploadFor] = useState<RecordFile | null>(null);
  const [viewing, setViewing] = useState<MapUpload | null>(null);
  const [replacing, setReplacing] = useState<MapUpload | null>(null);

  const {
    data: rows,
    loading,
    reload,
  } = useQuery(() => service.uploads.maps({ search }), [search], EMPTY_MAPS);

  const remove = async (row: MapUpload) => {
    if (!window.confirm(`Remove ${row.filename} (page ${row.pageNo}, version ${row.version})?`))
      return;
    const result = await service.uploads.removeMap(row.id);
    if (result.ok) {
      success('Map page removed.');
      reload();
    } else danger(result.error);
  };

  const actions = (row: MapUpload, large: boolean) => {
    const size = large ? 'md' : 'sm';
    return (
      <div className={large ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap justify-end gap-1.5'}>
        <Button
          variant="ghost"
          size={size}
          icon={<Eye size={16} />}
          onClick={() => setViewing(row)}
          disabled={!row.hasDocument}
          title={row.hasDocument ? 'View this map page' : 'No scan attached yet'}
        >
          View
        </Button>
        {canUpload && (
          <Button
            variant="ghost"
            size={size}
            icon={<ArrowsClockwise size={16} />}
            onClick={() => setReplacing(row)}
            title="Upload a newer scan of this page"
          >
            {row.hasDocument ? 'New version' : 'Attach scan'}
          </Button>
        )}
        {canUpload && (
          <Button
            variant="ghost"
            size={size}
            className={`text-[var(--rr-danger)] ${large ? 'col-span-2' : ''}`}
            icon={<Trash size={16} />}
            onClick={() => void remove(row)}
            aria-label={`Remove ${row.filename}`}
          >
            {large ? 'Remove' : undefined}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Maps"
        description="Scanned maps, drawings and copies attached to files. Find one, view it, or upload a new scan."
        actions={
          canUpload && (
            <Button onClick={() => setPicking(true)} icon={<MapPinPlus size={18} />}>
              Upload map
            </Button>
          )
        }
      />

      {flash && <Flash tone={flash.tone} text={flash.text} onDismiss={clear} />}

      <Card padding={false} className="overflow-hidden">
        <div className="border-b border-base p-3 sm:p-4">
          <div className="relative">
            <MagnifyingGlass
              className="muted pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
              size={18}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by file barcode, scan name or status"
              aria-label="Search maps"
              className="focus-ring h-11 w-full rounded-lg border border-base bg-[var(--rr-surface)] pl-10 pr-3 text-base outline-none placeholder:text-[var(--rr-muted)] sm:text-sm"
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              title={
                loading ? 'Loading maps' : search ? 'No maps match that search' : 'No maps yet'
              }
              description={
                loading
                  ? 'Fetching stored map pages.'
                  : 'Upload a scanned map to attach it to a file in the registry.'
              }
              action={
                !loading && canUpload ? (
                  <Button onClick={() => setPicking(true)} icon={<MapPinPlus size={17} />}>
                    Upload map
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-[var(--rr-bg)] text-[13px] muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">File</th>
                    <th className="px-4 py-3 font-semibold">Scan</th>
                    <th className="px-4 py-3 font-semibold">Page</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Uploaded</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--rr-border)]">
                  {rows.map((row) => (
                    <tr key={row.id} className="align-top hover:bg-[var(--rr-bg)]">
                      <td className="px-4 py-3.5">
                        <Link
                          to={`/search?q=${encodeURIComponent(row.fileBarcode)}`}
                          className="focus-ring mono rounded text-[13px] font-semibold text-accent hover:underline"
                        >
                          {row.fileBarcode}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <FileImage size={16} className="muted shrink-0" />
                          <span className="mono break-all text-xs">{row.filename}</span>
                        </div>
                        <p className="muted mt-1 text-xs">
                          {row.hasDocument && row.sizeBytes !== undefined
                            ? formatDocumentSize(row.sizeBytes)
                            : `${row.sizeKb.toLocaleString('en-IN')} KB`}
                          {describePageCount(row.pageCount) &&
                            ` · ${describePageCount(row.pageCount)}`}
                          {!row.hasDocument && ' · no scan attached'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[13px]">Page {row.pageNo}</span>{' '}
                        <Badge className="ml-1">v{row.version}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="muted px-4 py-3.5 text-xs">
                        {row.uploadedAt}
                        <span className="block">{row.uploadedBy}</span>
                      </td>
                      <td className="px-4 py-3">{actions(row, false)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-[var(--rr-border)] md:hidden">
              {rows.map((row) => (
                <li key={row.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="mono text-[13px] font-semibold text-accent">
                        {row.fileBarcode}
                      </p>
                      <p className="mono muted mt-0.5 break-all text-xs">{row.filename}</p>
                    </div>
                    <StatusBadge status={row.status} />
                  </div>
                  <p className="muted text-[13px]">
                    Page {row.pageNo} · v{row.version} · {row.uploadedAt} · {row.uploadedBy}
                    {!row.hasDocument && ' · no scan attached'}
                  </p>
                  {actions(row, true)}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {picking && (
        <PickFileModal
          onClose={() => setPicking(false)}
          onPick={(file) => {
            setPicking(false);
            setUploadFor(file);
          }}
        />
      )}

      {uploadFor && (
        <UploadMapModal
          file={uploadFor}
          onClose={() => setUploadFor(null)}
          onDone={(message) => {
            setUploadFor(null);
            success(message);
            reload();
          }}
          switchTo={() => undefined}
          canEdit={allowed('files.edit')}
          canUploadMap={canUpload}
        />
      )}

      {viewing && (
        <Modal
          open
          size="lg"
          onClose={() => setViewing(null)}
          title={`Map page ${viewing.pageNo} · version ${viewing.version}`}
          description={`${viewing.fileBarcode} · ${viewing.filename}`}
        >
          <DocumentViewer
            docKey={viewing.id}
            load={() => service.uploads.mapBlob(viewing.id)}
            filename={viewing.filename}
            contentType={viewing.contentType}
            pageIndex={viewing.pageIndex}
          />
        </Modal>
      )}

      {replacing && (
        <ReplaceMapModal
          row={replacing}
          onClose={() => setReplacing(null)}
          onDone={(message) => {
            setReplacing(null);
            success(message);
            reload();
          }}
        />
      )}
    </div>
  );
}

/** Step one of a new upload: choose which file in the registry the map belongs to. */
function PickFileModal({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (file: RecordFile) => void;
}) {
  const service = useService();
  const [term, setTerm] = useState('');
  const { data: result, loading } = useQuery(
    () => service.files.list({ search: term, pageSize: 8 }),
    [term],
    EMPTY_FILES,
  );

  return (
    <Modal
      open
      onClose={onClose}
      title="Upload map"
      description="First, find the file this map belongs to."
    >
      <div className="relative">
        <MagnifyingGlass
          className="muted pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
          size={18}
        />
        <input
          autoFocus
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="File number, barcode or subject"
          aria-label="Find the file"
          className="focus-ring h-12 w-full rounded-lg border border-base bg-[var(--rr-surface)] pl-10 pr-3 text-base outline-none placeholder:text-[var(--rr-muted)]"
        />
      </div>
      <ul className="mt-3 space-y-2" aria-live="polite">
        {result.items.map((file) => (
          <li key={file.id}>
            <button
              type="button"
              onClick={() => onPick(file)}
              className="focus-ring flex min-h-14 w-full items-center gap-3 rounded-xl border border-base p-3 text-left hover:border-[var(--rr-accent)] hover:bg-[var(--rr-bg)]"
            >
              <span className="min-w-0 flex-1">
                <span className="mono block text-[13px] font-semibold text-accent">
                  {file.fileNumber}
                </span>
                <span className="muted block truncate text-[13px]">{file.subject}</span>
              </span>
              <span className="mono muted shrink-0 text-xs">{file.fileBarcode}</span>
            </button>
          </li>
        ))}
        {result.items.length === 0 && (
          <li className="muted py-6 text-center text-sm">
            {loading ? 'Searching…' : 'No files match. Check the number or barcode.'}
          </li>
        )}
      </ul>
    </Modal>
  );
}

/** Attaches a newer scan to one existing map page. */
function ReplaceMapModal({
  row,
  onClose,
  onDone,
}: {
  row: MapUpload;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const service = useService();
  const [scan, setScan] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const issue = validateDocumentFile(scan);
    if (issue || !scan) return setError(issue ?? 'Choose a PDF or image first.');
    setBusy(true);
    setError(null);
    try {
      const result = await service.uploads.uploadMapDocument(row.id, scan);
      if (!result.ok) return setError(result.error);
      onDone(`Page ${row.pageNo} saved as version ${result.value.version}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={row.hasDocument ? 'Upload a new version' : 'Attach a scan'}
      description={`${row.fileBarcode} · page ${row.pageNo}. ${row.hasDocument ? 'The current scan is kept as an earlier version.' : 'This page has no scan yet.'}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!scan || busy} icon={<UploadSimple size={17} />}>
            {busy ? 'Uploading…' : 'Upload'}
          </Button>
        </>
      }
    >
      <DropZone
        file={scan}
        onFile={(next) => {
          setScan(next);
          setError(null);
        }}
        disabled={busy}
      />
      {error && (
        <p role="alert" className="mt-3 text-sm text-[var(--rr-danger)]">
          {error}
        </p>
      )}
    </Modal>
  );
}
