import type { CSSProperties } from 'react';

const assets = Array.from(
  { length: 10 },
  (_, index) => `/decorative/geo-${String(index + 1).padStart(2, '0')}.svg`,
);

export function DecorativeField({
  variant = 0,
  className = '',
  style,
}: {
  variant?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <img
      aria-hidden="true"
      src={assets[variant % assets.length]}
      className={`pointer-events-none absolute select-none opacity-40 ${className}`}
      style={style}
    />
  );
}
