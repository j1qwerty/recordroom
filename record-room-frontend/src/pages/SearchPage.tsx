import { useState } from 'react';
import { ArrowRight, Funnel, MagnifyingGlass, MapPin, Sparkle } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SelectInput } from '../components/ui/Field';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/Flash';
import { PageHeader } from '../components/ui/PageHeader';
import { DecorativeField } from '../components/DecorativeField';
import { useService } from '../hooks/useService';
import type { FileStatus } from '../types';

const STATUSES: Array<FileStatus | 'All'> = [
  'All',
  'Available',
  'Issued',
  'Under Digitization',
  'Missing',
  'Archived',
];

/**
 * Global search across the registry.
 *
 * The previous version filtered the mock array inline. This one goes through
 * `filesService.list`, the same query the registry page and the future
 * `GET /api/files` endpoint will use, so the filter semantics cannot drift.
 */
export function SearchPage() {
  const service = useService();
  const [params] = useSearchParams();

  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const [status, setStatus] = useState<FileStatus | 'All'>('All');
  const [department, setDepartment] = useState('All');
  const [ai, setAi] = useState(false);

  const result = useMemo(
    () => service.files.list({ search: query, status, department, pageSize: 50 }),
    [service, query, status, department],
  );
  const departments = service.files.departments();

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Search & locate"
        title="Find the record, then follow its physical path."
        description="Structured metadata search first. Semantic and AI-assisted retrieval can be layered on later without changing the physical location model."
        actions={
          <Button
            variant={ai ? 'primary' : 'ghost'}
            icon={<Sparkle size={17} />}
            onClick={() => setAi(!ai)}
          >
            {ai ? 'AI search on' : 'Enable AI search'}
          </Button>
        }
      />

      <section className="relative overflow-hidden rounded-2xl border border-base bg-[var(--rr-surface)] p-5">
        <div className="pointer-events-none absolute -left-8 bottom-0 h-24 w-36 opacity-25">
          <img src="/decorative/geo-03.svg" alt="" className="h-full w-full" />
        </div>
        <DecorativeField variant={4} className="-right-7 -top-8 w-48" />
        <div className="relative flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <MagnifyingGlass
              className="absolute left-4 top-1/2 -translate-y-1/2 text-accent"
              size={20}
            />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="focus-ring h-12 w-full rounded-xl border border-base bg-[var(--rr-bg)] pl-12 pr-4 text-sm outline-none"
              placeholder="Try RF-0000124587, REV/2021/4587, land acquisition or Revenue"
              aria-label="Search the registry"
            />
          </div>
          <SelectInput
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            aria-label="Department"
            className="lg:w-52"
          >
            <option value="All">All departments</option>
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            value={status}
            onChange={(event) => setStatus(event.target.value as FileStatus | 'All')}
            aria-label="Status"
            className="lg:w-48"
          >
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item === 'All' ? 'All statuses' : item}
              </option>
            ))}
          </SelectInput>
        </div>
        {ai && (
          <div className="mt-4 rounded-xl border border-[var(--rr-accent)]/30 bg-accent-soft p-4 text-sm">
            <span className="font-semibold text-accent">AI mode:</span> natural-language retrieval
            returns only records the signed-in user can access, with source-linked results in the
            production backend. It is off here because there is no embedding index yet.
          </div>
        )}
        <p className="muted relative mt-3 flex items-center gap-1.5 text-[11px]">
          <Funnel size={13} />
          Filtering runs over the rows loaded in the browser; the full registry query belongs to the
          API.
        </p>
      </section>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{result.total} record(s) shown</p>
        <p className="muted text-xs">Server-side pagination in production</p>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          title="Nothing matched that search"
          description="Try a barcode prefix, a file number, a department, or clear the filters."
          action={
            <Button
              variant="ghost"
              onClick={() => {
                setQuery('');
                setStatus('All');
                setDepartment('All');
              }}
            >
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {result.items.map((file) => (
            <Link
              key={file.id}
              to={`/files/${file.id}`}
              className="block rounded-2xl border border-base bg-[var(--rr-surface)] p-5 transition hover:border-[var(--rr-accent)]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={file.status} />
                    <span className="font-mono text-xs muted">{file.fileBarcode}</span>
                    <Badge tone="neutral">{file.fileType}</Badge>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold tracking-tight">{file.subject}</h2>
                  <p className="muted mt-1 text-sm">
                    {file.fileNumber} · {file.department} · {file.year}
                  </p>
                  <p className="muted mt-3 max-w-3xl text-sm leading-6">{file.description}</p>
                  {file.holder && (
                    <p className="mt-3 text-xs text-[var(--rr-warning)]">
                      Currently with {file.holder}
                    </p>
                  )}
                </div>
                <div className="min-w-0 rounded-xl bg-[var(--rr-bg)] p-4 lg:w-[360px]">
                  <div className="flex items-center gap-2 text-xs font-bold text-accent">
                    <MapPin size={16} /> Physical location
                  </div>
                  <p className="mt-2 text-xs leading-5">{file.location}</p>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.12em] muted">
                    Approx shelf position
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--rr-surface-2)]">
                    <div
                      className="h-full rounded-full bg-[var(--rr-accent)]"
                      style={{ width: `${file.position}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-[10px] muted">{file.position}% along shelf</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-1 text-xs font-semibold text-accent">
                Open file & locate <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
