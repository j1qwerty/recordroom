import {
  ArrowLeft,
  Barcode,
  CheckCircle,
  DownloadSimple,
  FileText,
  MapPin,
  Printer,
  ShieldCheck,
  UserCircle,
} from '@phosphor-icons/react';
import { useNavigate, useParams } from 'react-router-dom';
import { files } from '../data/mock';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { LinkButton, Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { ShelfView } from '../components/ShelfView';
import { rooms } from '../data/mock';

export function FileDetailPage() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const file = files.find((item) => item.id === fileId) ?? files[0];
  const room = rooms.find((item) => item.id === file.roomId) ?? rooms[0];
  const unit = room.storageUnits.find((item) => item.code === file.almirah) ?? room.storageUnits[0];
  return (
    <div className="space-y-7">
      <button
        onClick={() => navigate(-1)}
        className="focus-ring inline-flex items-center gap-2 text-xs font-semibold muted hover:text-[var(--rr-text)]"
      >
        <ArrowLeft size={15} /> Back
      </button>
      <PageHeader
        kicker="Record file"
        title={file.subject}
        description={`${file.fileNumber} · ${file.department} · ${file.year}`}
        actions={
          <>
            <Button variant="ghost" icon={<Printer size={17} />}>
              Print label
            </Button>
            <Button variant="ghost" icon={<DownloadSimple size={17} />}>
              Download
            </Button>
            <LinkButton to="/issue" icon={<Barcode size={17} />}>
              Issue / move
            </LinkButton>
          </>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-5">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-sm font-semibold text-accent">{file.rfId}</p>
                <p className="muted mt-2 text-xs">
                  Permanent identity · immutable for the file lifecycle
                </p>
              </div>
              <Badge
                tone={
                  file.status === 'Available'
                    ? 'success'
                    : file.status === 'Issued'
                      ? 'warning'
                      : 'info'
                }
              >
                {file.status}
              </Badge>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Info label="File number" value={file.fileNumber} />
              <Info label="Department" value={file.department} />
              <Info label="Year" value={String(file.year)} />
              <Info label="Codal life" value={file.codalLife} />
              <Info label="Created" value={file.createdAt} />
              <Info label="Last movement" value={file.lastMovement} />
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-2">
              <FileText className="text-accent" size={19} />
              <p className="text-sm font-semibold">Description</p>
            </div>
            <p className="muted mt-4 text-sm leading-7">{file.description}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-accent" size={19} />
              <p className="text-sm font-semibold">Digital document</p>
            </div>
            <div className="mt-4 rounded-xl border border-dashed border-base p-5">
              <p className="text-sm font-semibold">
                No production document attached in this frontend build.
              </p>
              <p className="muted mt-1 text-xs leading-6">
                The backend will link PDFs, versions, OCR text, checksums and access policy to this
                physical file.
              </p>
            </div>
          </Card>
        </div>
        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Exact physical location</p>
                <p className="muted mt-1 text-xs">Current location at last verified scan</p>
              </div>
              <MapPin className="text-accent" size={19} />
            </div>
            <div className="mt-4 rounded-xl bg-accent-soft p-4">
              <p className="text-sm font-semibold">{file.location}</p>
              <p className="muted mt-2 text-xs">
                Approximate shelf position · {file.position}% along shelf
              </p>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--rr-surface)]">
                <div
                  className="h-full rounded-full bg-[var(--rr-accent)]"
                  style={{ width: `${file.position}%` }}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <LinkButton
                to={`/rooms/${file.roomId}`}
                variant="ghost"
                className="flex-1"
                icon={<MapPin size={16} />}
              >
                Open room
              </LinkButton>
              <LinkButton
                to="/search"
                variant="ghost"
                className="flex-1"
                icon={<Barcode size={16} />}
              >
                Locate flow
              </LinkButton>
            </div>
          </Card>
          <Card>
            <ShelfView unit={unit} activeShelf={file.shelf} />
          </Card>
          <Card>
            <div className="flex items-center gap-2">
              <UserCircle className="text-accent" size={19} />
              <p className="text-sm font-semibold">Current custodian state</p>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-[var(--rr-bg)] p-4">
              <CheckCircle className="text-[var(--rr-success)]" size={20} />
              <div>
                <p className="text-sm font-semibold">{file.holder ?? 'In record room'}</p>
                <p className="muted mt-1 text-xs">
                  Issue/return state is controlled by barcode scans.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="muted text-[10px] uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
