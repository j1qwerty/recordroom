import { Funnel, MagnifyingGlass, MapPin, Sparkle, ArrowRight } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { files } from '../data/mock';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { DecorativeField } from '../components/DecorativeField';

export function SearchPage() {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const [ai, setAi] = useState(false);
  const filtered = useMemo(
    () =>
      files.filter((file) =>
        [file.rfId, file.fileNumber, file.subject, file.department, file.description]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Search & locate"
        title="Find the record, then follow its physical path."
        description="Search structured metadata first. Semantic and AI-assisted search can be layered on later without changing the physical location model."
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
              placeholder="Try RF-0000124587, ABC/2021/4587, land acquisition or Revenue"
            />
          </div>
          <Button variant="ghost" icon={<Funnel size={17} />}>
            Filters
          </Button>
        </div>
        {ai && (
          <div className="mt-4 rounded-xl border border-[var(--rr-accent)]/30 bg-accent-soft p-4 text-sm">
            <span className="font-semibold text-accent">AI mode:</span> natural-language retrieval
            will return only records the signed-in user can access, with source-linked results in
            the production backend.
          </div>
        )}
      </section>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{filtered.length} records shown</p>
        <p className="muted text-xs">Server-side pagination in production</p>
      </div>
      <div className="space-y-3">
        {filtered.map((file) => (
          <Link
            key={file.id}
            to={`/files/${file.id}`}
            className="block rounded-2xl border border-base bg-[var(--rr-surface)] p-5 transition hover:border-[var(--rr-accent)]"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
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
                  <span className="font-mono text-xs muted">{file.rfId}</span>
                </div>
                <h2 className="mt-3 text-lg font-semibold tracking-tight">{file.subject}</h2>
                <p className="muted mt-1 text-sm">
                  {file.fileNumber} · {file.department} · {file.year}
                </p>
                <p className="muted mt-3 max-w-3xl text-sm leading-6">{file.description}</p>
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
    </div>
  );
}
