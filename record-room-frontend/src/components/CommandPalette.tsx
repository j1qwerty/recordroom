import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, MagnifyingGlass, X } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { useService, useSession, type Permission } from '../hooks/useService';
import type { RecordFile } from '../types';

type PaletteItem = {
  id: string;
  label: string;
  detail: string;
  group: 'Pages' | 'Actions' | 'Records';
  href: string;
  permission?: Permission;
};

const BASE_ITEMS: PaletteItem[] = [
  { id: 'dashboard', label: 'Dashboard', detail: 'Overview and recent activity', group: 'Pages', href: '/' },
  { id: 'search', label: 'Search records', detail: 'Find by barcode, file number or subject', group: 'Pages', href: '/search', permission: 'files.view' },
  { id: 'files', label: 'File registry', detail: 'Browse and filter registered records', group: 'Pages', href: '/files', permission: 'files.view' },
  { id: 'locations', label: 'Physical locations', detail: 'Rooms, sections, almirahs and shelves', group: 'Pages', href: '/admin/locations', permission: 'locations.view' },
  { id: 'maps', label: 'Maps and copies', detail: 'View or upload scanned maps and file copies', group: 'Pages', href: '/admin/maps', permission: 'files.view' },
  { id: 'digitization', label: 'Digitization', detail: 'Batches, scans and review status', group: 'Pages', href: '/digitization', permission: 'digitization.view' },
  { id: 'movement', label: 'Movement log', detail: 'Trace where a record has moved', group: 'Pages', href: '/movement', permission: 'files.view' },
  { id: 'reports', label: 'Reports', detail: 'Open registry and operations reports', group: 'Pages', href: '/reports', permission: 'reports.view' },
  { id: 'users', label: 'User administration', detail: 'Manage application accounts', group: 'Pages', href: '/admin/users', permission: 'users.view' },
  { id: 'new-file', label: 'Register a file', detail: 'Create a physical record and assign its shelf', group: 'Actions', href: '/files/new', permission: 'files.create' },
  { id: 'issue', label: 'Issue a file', detail: 'Record a handover', group: 'Actions', href: '/issue', permission: 'issue.issue' },
  { id: 'return', label: 'Return a file', detail: 'Record a return or close an issue', group: 'Actions', href: '/return', permission: 'issue.return' },
  { id: 'upload-map', label: 'Upload a map or copy', detail: 'Open map uploads and version history', group: 'Actions', href: '/admin/maps', permission: 'digitization.upload' },
  { id: 'export-files', label: 'Export registry', detail: 'Open the registry export controls', group: 'Actions', href: '/files', permission: 'files.view' },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const service = useService();
  const navigate = useNavigate();
  const { allowed } = useSession();
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<RecordFile[]>([]);
  const [recordsQuery, setRecordsQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const availableItems = useMemo(
    () => BASE_ITEMS.filter((item) => !item.permission || allowed(item.permission)),
    [allowed],
  );
  const filteredItems = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return availableItems;
    return availableItems.filter((item) => `${item.label} ${item.detail}`.toLocaleLowerCase().includes(term));
  }, [availableItems, query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (!open) {
          setQuery('');
          setActiveIndex(0);
        }
        // The same shortcut opens and closes the palette.
        if (open) onClose();
        else window.dispatchEvent(new CustomEvent('rr:open-command-palette'));
      }
      if (open && event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    const openPalette = () => {
      setQuery('');
      setActiveIndex(0);
    };
    window.addEventListener('rr:open-command-palette', openPalette);
    return () => window.removeEventListener('rr:open-command-palette', openPalette);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (!open || term.length < 2 || !allowed('files.view')) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const result = await service.files.list({ search: term, page: 1, pageSize: 6 });
        if (!cancelled) {
          setRecords(result.items);
          setRecordsQuery(term);
        }
      } catch {
        if (!cancelled) {
          setRecords([]);
          setRecordsQuery(term);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query, service, allowed]);

  const recordItems: PaletteItem[] = query.trim().length >= 2 && recordsQuery === query.trim()
    ? records.map((file) => ({
        id: `record-${file.id}`,
        label: file.fileNumber || file.fileBarcode,
        detail: [file.subject, file.fileBarcode, file.location].filter(Boolean).join(' · '),
        group: 'Records',
        href: `/files/${file.id}`,
        permission: 'files.view',
      }))
    : [];
  const allItems = [...filteredItems, ...recordItems];

  const execute = (item: PaletteItem) => {
    onClose();
    navigate(item.href);
  };

  const moveSelection = (step: number) => {
    if (allItems.length === 0) return;
    setActiveIndex((current) => (current + step + allItems.length) % allItems.length);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/50 p-3 pt-[10vh] backdrop-blur-[2px] sm:p-6 sm:pt-[12vh]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
        className="surface w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl"
      >
        <h2 id="command-palette-title" className="sr-only">Search pages, files and actions</h2>
        <div className="flex items-center gap-3 border-b border-base px-4">
          <MagnifyingGlass size={20} className="muted shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                moveSelection(1);
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                moveSelection(-1);
              } else if (event.key === 'Enter' && allItems[activeIndex]) {
                event.preventDefault();
                execute(allItems[activeIndex]);
              }
            }}
            placeholder="Search a page, action, file number or barcode…"
            className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--rr-muted)]"
            aria-label="Search command palette"
          />
          <button onClick={onClose} className="focus-ring rounded-md p-1.5 muted hover:bg-[var(--rr-surface-2)]" aria-label="Close command palette">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[min(65dvh,520px)] overflow-y-auto p-2">
          {(['Pages', 'Actions', 'Records'] as const).map((group) => {
            const groupItems = allItems.filter((item) => item.group === group);
            if (groupItems.length === 0) return null;
            return (
              <div key={group} className="mb-2">
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider muted">{group}</p>
                {groupItems.map((item) => {
                  const index = allItems.findIndex((candidate) => candidate.id === item.id);
                  return (
                    <button
                      key={item.id}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => execute(item)}
                      className={`focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${index === activeIndex ? 'bg-accent-soft' : 'hover:bg-[var(--rr-surface-2)]'}`}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-base bg-[var(--rr-surface)] text-accent">
                        {group === 'Records' ? <MagnifyingGlass size={19} /> : <ArrowRight size={18} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{item.label}</span>
                        <span className="muted mt-0.5 block truncate text-xs">{item.detail}</span>
                      </span>
                      {index === activeIndex && <span className="hidden items-center gap-1 text-[10px] muted sm:flex"><ArrowUp size={12} /><ArrowDown size={12} /> Enter</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
          {open && query.trim().length >= 2 && searching && <p className="muted px-3 py-4 text-sm">Searching the registry…</p>}
          {!(open && query.trim().length >= 2 && searching) && allItems.length === 0 && (
            <p className="muted px-3 py-8 text-center text-sm">
              No matches. Try a different page name, file number or barcode.
            </p>
          )}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-base px-4 py-3 text-[11px] muted">
          <span>Type to search. Use ↑ ↓ and Enter to open a result.</span>
          <span>Esc to close</span>
        </footer>
      </section>
    </div>
  );
}
