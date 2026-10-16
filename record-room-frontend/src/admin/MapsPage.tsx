import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FileImage, MagnifyingGlass, Plus, Trash } from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Field, TextInput } from '../components/ui/Field';
import { Flash, StatusBadge } from '../components/ui/Flash';
import { EmptyState } from '../components/ui/EmptyState';
import { DocumentUploadActions } from '../components/DocumentUploadActions';
import { useQuery, useService, useSession } from '../hooks/useService';
import type { MapUpload, RecordFile } from '../types';

/**
 * `upload_map` — scanned maps and file copies.
 *
 * Legacy `viewmap` / `viewfilecopy` screens listed these rows against the
 * registry. A new scan of the same file and page becomes the next version and
 * retires the previous approval, which is why versions are shown rather than
 * hidden.
 */
export function MapsPage() {
  const service = useService();
  const session = useSession();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const presetBarcode = params.get('fileBarcode') ?? '';
  const openUploadOnLoad = params.get('add') === '1';
  // MapsPage rows are digitization scans, so reuse that permission. It matches the
  // API's Admin/Supervisor/Operator gate on `POST /api/uploads/maps/{id}/document`.
  const canUpload = session.allowed('digitization.upload');

  const [search, setSearch] = useState(presetBarcode);
  const [adding, setAdding] = useState(openUploadOnLoad && canUpload);
  const [flash, setFlash] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  // The API owns the filter, so re-running on every keystroke matches what the
  // old synchronous search did.
  const {
    data: rows,
    loading,
    reload,
  } = useQuery(() => (presetBarcode && search.trim() === presetBarcode ? service.uploads.maps({ fileBarcode: presetBarcode }) : service.uploads.maps({ search })), [search, presetBarcode], [] as MapUpload[]);
  // Registry rows a map can hang off. Derived once and kept in the query so the
  // datalist does not refetch while typing in the form.
  const { data: grouped } = useQuery(
    async () => {
      const result = await service.files.list({ pageSize: 200 });
      return result.items.filter((file) => file.recordKind === 'Map' || (!file.recordKind && (file.fileType === 'Map' || file.fileType === 'Drawing')));
    },
    [],
    [] as RecordFile[],
  );

  const remove = async (id: string) => {
    const result = await service.uploads.removeMap(id);
    setFlash(
      result.ok
        ? { tone: 'success', text: 'Map page removed.' }
        : { tone: 'danger', text: result.error },
    );
    if (result.ok) reload();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Maps & file copies"
        description="Scanned maps, drawings and copies attached to registry rows, with the version history the legacy upload_map table kept."
        actions={
          canUpload && (
            <Button icon={<Plus size={17} />} onClick={() => setAdding(true)}>
              Add map page
            </Button>
          )
        }
      />

      {flash && <Flash tone={flash.tone} text={flash.text} onDismiss={() => setFlash(null)} />}

      <Card padding={false} className="overflow-hidden">
        <div className="border-b border-base p-4">
          <div className="relative">
            <MagnifyingGlass
              className="muted absolute left-3.5 top-1/2 -translate-y-1/2"
              size={17}
            />
            <TextInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Barcode, file name or status…"
              className="pl-10"
              aria-label="Search map uploads"
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={loading ? 'Loading map uploads' : 'No map uploads'}
              description={
                loading
                  ? 'Asking for the stored map pages.'
                  : 'Add a scanned map page to attach it to a registry row.'
              }
              action={
                loading || !canUpload ? undefined : <Button onClick={() => setAdding(true)}>Add map page</Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="bg-[var(--rr-bg)] text-xs uppercase tracking-wider muted">
                <tr>
                  <th className="px-5 py-3">File barcode</th>
                  <th className="px-5 py-3">Scanned file</th>
                  <th className="px-5 py-3">Page</th>
                  <th className="px-5 py-3">Version</th>
                  <th className="px-5 py-3">Size</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Uploaded</th>
                  <th className="px-5 py-3">Document</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rr-border)]">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--rr-bg)]">
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-accent">
                      {row.fileBarcode}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <FileImage size={16} className="muted" />
                        <span className="font-mono text-xs">{row.filename}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs">{row.pageNo}</td>
                    <td className="px-5 py-4">
                      <Badge>v{row.version}</Badge>
                    </td>
                    <td className="px-5 py-4 text-xs muted">
                      {row.sizeKb.toLocaleString('en-IN')} KB
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-5 py-4 text-xs muted">
                      {row.uploadedAt}
                      <span className="block text-[11px]">{row.uploadedBy}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="min-w-[260px]">
                        <DocumentUploadActions
                          filename={row.filename}
                          version={row.version}
                          hasDocument={row.hasDocument === true}
                          contentType={row.contentType}
                          sizeBytes={row.sizeBytes}
                          pageCount={row.pageCount}
                          pageIndex={row.pageIndex}
                          canUpload={canUpload}
                          onUpload={(file) => service.uploads.uploadMapDocument(row.id, file)}
                          getBlob={() => service.uploads.mapBlob(row.id)}
                          onUploaded={() => reload()}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {session.allowed('files.edit') && (
                        <Button
                          variant="ghost"
                          onClick={() => remove(row.id)}
                          aria-label={`Remove ${row.filename}`}
                          icon={<Trash size={15} />}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add map page">
        <MapForm
          initialBarcode={presetBarcode}
          candidates={grouped.map((file) => ({
            barcode: file.fileBarcode,
            label: `${file.fileBarcode} · ${file.subject}`,
          }))}
          onSubmit={async (input) => {
            const result = await service.uploads.addMap(input);
            if (!result.ok) {
              setFlash({ tone: 'danger', text: result.error });
              return;
            }
            setAdding(false);
            setFlash({
              tone: 'success',
              text: `${result.value.filename} stored as version ${result.value.version}.`,
            });
            reload();
          }}
        />
      </Modal>
    </div>
  );
}

function MapForm({
  candidates,
  initialBarcode = '',
  onSubmit,
}: {
  candidates: Array<{ barcode: string; label: string }>;
  initialBarcode?: string;
  onSubmit: (input: {
    fileBarcode: string;
    pageNo: number;
    filename: string;
    sizeKb: number;
  }) => void;
}) {
  const [fileBarcode, setFileBarcode] = useState(initialBarcode);
  const [pageNo, setPageNo] = useState(1);
  const [filename, setFilename] = useState('');
  const [sizeKb, setSizeKb] = useState(1200);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ fileBarcode, pageNo, filename, sizeKb });
      }}
    >
      <Field label="Registry barcode" htmlFor="map-barcode" required>
        <TextInput
          id="map-barcode"
          list="map-candidates"
          value={fileBarcode}
          onChange={(event) => setFileBarcode(event.target.value)}
          className="font-mono"
        />
        <datalist id="map-candidates">
          {candidates.map((item) => (
            <option key={item.barcode} value={item.barcode}>
              {item.label}
            </option>
          ))}
        </datalist>
      </Field>
      <Field label="Scanned file name" htmlFor="map-filename" required>
        <TextInput
          id="map-filename"
          value={filename}
          onChange={(event) => setFilename(event.target.value)}
          className="font-mono"
          placeholder="RF-0000111880-MAP-1.png"
        />
      </Field>
      <Field label="Page number" htmlFor="map-page">
        <TextInput
          id="map-page"
          type="number"
          min={1}
          value={pageNo}
          onChange={(event) => setPageNo(Number(event.target.value))}
        />
      </Field>
      <Field label="Size in KB" htmlFor="map-size">
        <TextInput
          id="map-size"
          type="number"
          min={1}
          value={sizeKb}
          onChange={(event) => setSizeKb(Number(event.target.value))}
        />
      </Field>
      <Button type="submit">Store map page</Button>
    </form>
  );
}
