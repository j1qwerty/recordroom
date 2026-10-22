import { useMemo } from 'react';
import { encodeCode128 } from '../lib/barcode';
import { cn } from '../lib/utils';

/**
 * Renders a real Code 128 symbol from the project's own encoder.
 *
 * The previous implementation drew CSS gradients, which is not a barcode — it
 * cannot be scanned. This one produces module widths a laser scanner reads, and
 * it degrades to the human-readable payload underneath.
 */
export function BarcodeSymbol({
  value,
  height = 64,
  className,
  showText = true,
  title,
}: {
  value: string;
  height?: number;
  className?: string;
  showText?: boolean;
  title?: string;
}) {
  const modules = useMemo(() => encodeCode128(value), [value]);

  const geometry = useMemo(() => {
    const quiet = 10;
    const total = modules.reduce((sum, module) => sum + module.width, 0) + quiet * 2;
    let cursor = quiet;
    const rects: Array<{ x: number; width: number }> = [];
    modules.forEach((module) => {
      if (module.black) rects.push({ x: cursor, width: module.width });
      cursor += module.width;
    });
    return { rects, total };
  }, [modules]);

  return (
    <div className={cn('inline-flex flex-col items-center', className)}>
      <svg
        role="img"
        aria-label={title ? `Barcode ${title}` : `Barcode ${value}`}
        viewBox={`0 0 ${geometry.total} 40`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        <rect x="0" y="0" width={geometry.total} height="40" fill="transparent" />
        {geometry.rects.map((rect, index) => (
          <rect
            // Module widths repeat, so the index is the only stable identity here.
            key={`${rect.x}-${index}`}
            x={rect.x}
            y="0"
            width={rect.width}
            height="40"
            fill="currentColor"
          />
        ))}
      </svg>
      {showText && <p className="mt-2 font-mono text-[11px] tracking-[0.18em] muted">{value}</p>}
    </div>
  );
}
