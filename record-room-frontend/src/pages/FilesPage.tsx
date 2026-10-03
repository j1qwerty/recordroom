import { DownloadSimple, FileCsv, Funnel, Plus, UploadSimple } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { files } from '../data/mock';
import { PageHeader } from '../components/ui/PageHeader';
import { LinkButton, Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function FilesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Registry"
        title="Files"
        description="Searchable physical-file master data with stable RF identifiers and mutable location state."
        actions={
          <>
            <Button variant="ghost" icon={<UploadSimple size={17} />}>
              Bulk import
            </Button>
            <LinkButton to="/files/new" icon={<Plus size={17} />}>
              Create file
            </LinkButton>
          </>
        }
      />
      <Card padding={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" icon={<Funnel size={16} />}>
              Filters
            </Button>
            <p className="muted text-xs">6 demo rows · server pagination in production</p>
          </div>
          <Button variant="ghost" icon={<DownloadSimple size={16} />}>
            Export
          </Button>
        </div>
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
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-[var(--rr-bg)]">
                  <td className="px-5 py-4">
                    <Link to={`/files/${file.id}`} className="font-semibold hover:text-accent">
                      {file.fileNumber}
                    </Link>
                    <div className="mt-1 font-mono text-[10px] muted">{file.rfId}</div>
                    <div className="mt-2 max-w-sm text-xs muted">{file.subject}</div>
                  </td>
                  <td className="px-5 py-4">{file.department}</td>
                  <td className="px-5 py-4">{file.year}</td>
                  <td className="px-5 py-4">
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
                  </td>
                  <td className="px-5 py-4 text-xs">{file.location}</td>
                  <td className="px-5 py-4 text-xs muted">{file.lastMovement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-base p-4">
          <p className="text-xs muted">Showing 1–6 of 2,478,450</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" disabled>
              Previous
            </Button>
            <Button variant="ghost">Next</Button>
          </div>
        </div>
      </Card>
      <div className="rounded-2xl border border-base bg-accent-soft p-5">
        <div className="flex gap-3">
          <FileCsv size={20} className="mt-0.5 text-accent" />
          <div>
            <p className="text-sm font-semibold">Bulk-first operations</p>
            <p className="muted mt-1 text-sm leading-6">
              The production interface should import large batches asynchronously, validate
              duplicates before commit and allow operators to reconcile exceptions rather than
              editing millions of rows manually.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
