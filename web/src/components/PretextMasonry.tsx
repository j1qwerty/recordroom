import { layout, prepare } from '@chenglou/pretext';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export interface PretextMasonryMeta {
  extraHeight?: number;
  imageHeight?: number;
  headingFont?: string;
}

interface PretextMasonryProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  getItemText: (item: T) => string;
  getItemMeta?: (item: T) => PretextMasonryMeta;
  columnWidth?: number;
  gap?: number;
  className?: string;
}

function useElementWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => setWidth(node.getBoundingClientRect().width);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

export function PretextMasonry<T>({
  items,
  renderItem,
  getItemText,
  getItemMeta,
  columnWidth = 320,
  gap = 20,
  className = '',
}: PretextMasonryProps<T>) {
  const [ref, width] = useElementWidth();
  const columnCount = Math.max(1, Math.min(4, Math.floor((width + gap) / (columnWidth + gap))));
  const textWidth = Math.max(180, Math.floor((width - gap * (columnCount - 1)) / columnCount) - 40);

  const columns = useMemo(() => {
    const heights = new Array(columnCount).fill(0) as number[];
    const nextColumns = Array.from({ length: columnCount }, () => [] as T[]);

    for (const item of items) {
      const meta = getItemMeta?.(item) ?? {};
      const font = meta.headingFont ?? '400 14px Inter';
      const prepared = prepare(getItemText(item), font);
      const { height } = layout(prepared, textWidth, 22);
      const estimatedHeight = height + (meta.extraHeight ?? 120) + (meta.imageHeight ?? 0);
      let target = 0;
      for (let i = 1; i < heights.length; i += 1) {
        if (heights[i] < heights[target]) target = i;
      }
      nextColumns[target].push(item);
      heights[target] += estimatedHeight + gap;
    }

    return nextColumns;
  }, [columnCount, gap, getItemMeta, getItemText, items, textWidth]);

  return (
    <div ref={ref} className={`w-full ${className}`}>
      <div className="flex items-start" style={{ gap }}>
        {columns.map((column, columnIndex) => (
          <div
            key={`pretext-column-${columnIndex}`}
            className="min-w-0 flex-1"
            style={{ display: 'grid', gap }}
          >
            {column.map((item, itemIndex) => (
              <div key={itemIndex}>{renderItem(item)}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
