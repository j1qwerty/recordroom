import { motion } from 'motion/react';
import { MapPin, Scan } from '@phosphor-icons/react';
import type { Room, StorageUnit } from '../types';
import { cn } from '../lib/utils';

export function RoomMap({
  room,
  selectedId,
  onSelect,
  compact = false,
}: {
  room: Room;
  selectedId?: string;
  onSelect?: (unit: StorageUnit) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-base bg-[var(--rr-bg)]',
        compact ? 'h-72' : 'min-h-[520px]',
      )}
    >
      <div className="page-grid absolute inset-0 opacity-60" />
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-base bg-[var(--rr-surface)]/90 px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur">
        <Scan size={15} className="text-accent" /> {room.code} · {room.name}
      </div>
      <div className="absolute inset-0 p-8">
        {room.storageUnits.map((unit, index) => (
          <motion.button
            key={unit.id}
            type="button"
            onClick={() => onSelect?.(unit)}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.16 }}
            className={cn('absolute text-left', selectedId === unit.id && 'z-20')}
            style={{
              left: `${unit.x}%`,
              top: `${unit.y}%`,
              width: `${unit.width}%`,
              height: `${unit.height}%`,
            }}
            aria-label={`Open ${unit.name}`}
          >
            <div
              className={cn(
                'flex h-full w-full flex-col rounded-xl border p-2 shadow-sm transition',
                selectedId === unit.id
                  ? 'border-[var(--rr-accent)] bg-accent-soft shadow-md'
                  : 'border-base bg-[var(--rr-surface)] hover:border-[var(--rr-accent)]',
              )}
            >
              <div className="flex items-center justify-between gap-2 border-b border-base pb-2 text-xs font-bold">
                <span>{unit.code}</span>
                <span className="text-[10px] font-medium muted">
                  {Math.round(
                    (unit.shelves.reduce((a, s) => a + s.occupied, 0) /
                      unit.shelves.reduce((a, s) => a + s.capacity, 0)) *
                      100,
                  )}
                  %
                </span>
              </div>
              <div className="grid flex-1 grid-rows-6 gap-1 py-2">
                {unit.shelves.map((shelf) => (
                  <div
                    key={shelf.id}
                    className="relative overflow-hidden rounded border border-base bg-[var(--rr-surface-2)]"
                  >
                    <div
                      className="absolute bottom-0 left-0 h-1/2 bg-[var(--rr-accent)]/25"
                      style={{ width: `${(shelf.occupied / shelf.capacity) * 100}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 text-[10px] muted">
                <MapPin size={11} /> {index + 1}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
