import { cn } from '../lib/utils';
import type { StorageUnit, Shelf } from '../types';

export function ShelfView({ unit, activeShelf }: { unit: StorageUnit; activeShelf?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{unit.name}</p>
          <p className="muted text-xs">
            {unit.code} · {unit.type}
          </p>
        </div>
        <span className="text-xs muted">{unit.shelves.length} shelves</span>
      </div>
      <div className="rounded-xl border border-base bg-[var(--rr-surface-2)] p-3">
        {unit.shelves.map((shelf) => (
          <ShelfRow key={shelf.id} shelf={shelf} active={activeShelf === shelf.code} />
        ))}
      </div>
    </div>
  );
}

function ShelfRow({ shelf, active }: { shelf: Shelf; active?: boolean }) {
  const occupancy = shelf.occupied / shelf.capacity;
  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition',
        active ? 'border-[var(--rr-accent)] bg-[var(--rr-surface)]' : 'border-transparent',
      )}
    >
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold">{shelf.code}</span>
        <span className="muted">
          {shelf.occupied}/{shelf.capacity} approx.
        </span>
      </div>
      <div className="relative h-10 overflow-hidden rounded border border-base bg-[var(--rr-surface)]">
        <div
          className="absolute inset-y-0 left-0 bg-accent-soft"
          style={{ width: `${occupancy * 100}%` }}
        />
        <div className="absolute inset-x-0 bottom-0 h-px bg-[var(--rr-accent)]/40" />
        {active && (
          <div
            className="absolute bottom-1/2 left-[67%] top-0 w-1 -translate-x-1/2 rounded-full bg-[var(--rr-accent)] shadow-[0_0_0_4px_var(--rr-accent-soft)]"
            title="Approximate file location"
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-[10px] muted">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
