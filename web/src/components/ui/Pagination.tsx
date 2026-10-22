import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';

/**
 * Paginates whatever the service returned.
 *
 * The registry holds ~25 lakh rows server-side, so this control moves the
 * window over the rows the client actually loaded and always states the true
 * collection total rather than the loaded slice.
 */
export function Pagination({
  page,
  pageSize,
  total,
  collectionTotal,
  onPage,
  onPageSize,
  label = 'records',
}: {
  page: number;
  pageSize: number;
  total: number;
  /** Full registry size when it differs from the filtered `total`. */
  collectionTotal?: number;
  onPage: (page: number) => void;
  onPageSize?: (pageSize: number) => void;
  label?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col gap-3 border-t border-base p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs muted">
        Showing <span className="font-semibold">{first}</span>–
        <span className="font-semibold">{last}</span> of{' '}
        <span className="font-semibold">{total.toLocaleString('en-IN')}</span> filtered {label}
        {collectionTotal !== undefined && collectionTotal !== total && (
          <> · {collectionTotal.toLocaleString('en-IN')} in the registry</>
        )}
      </p>
      <div className="flex items-center gap-2">
        {onPageSize && (
          <select
            aria-label="Rows per page"
            value={pageSize}
            onChange={(event) => onPageSize(Number(event.target.value))}
            className="focus-ring h-9 rounded-lg border border-base bg-[var(--rr-bg)] px-2 text-xs outline-none"
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size} rows
              </option>
            ))}
          </select>
        )}
        <span className="text-xs muted">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={cn(
            'focus-ring grid size-9 place-items-center rounded-lg border border-base transition disabled:opacity-40',
            page > 1 && 'hover:bg-[var(--rr-surface-2)]',
          )}
        >
          <CaretLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
          className={cn(
            'focus-ring grid size-9 place-items-center rounded-lg border border-base transition disabled:opacity-40',
            page < pages && 'hover:bg-[var(--rr-surface-2)]',
          )}
        >
          <CaretRight size={16} />
        </button>
      </div>
    </div>
  );
}
