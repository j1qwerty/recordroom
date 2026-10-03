/**
 * CSV export helper.
 *
 * The legacy app exported `.xls` files from PHP. Reports here emit RFC 4180
 * CSV first (see `docs/LEGACY-GAP-REPORT.md` TODO 6) because it needs no
 * dependency and opens in Excel; the .NET 10 reports worker will own real
 * `.xlsx` later.
 */

export type CsvValue = string | number | boolean | null | undefined;

/** Quotes a cell only when CSV quoting rules require it. */
export function escapeCsvCell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(columns: string[], rows: CsvValue[][]): string {
  const header = columns.map(escapeCsvCell).join(',');
  const body = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
  return `${header}\r\n${body}`;
}

/**
 * Triggers a browser download. Returns false when there is no DOM (tests,
 * SSR) so callers can report "nothing downloaded" instead of throwing.
 */
export function downloadCsv(filename: string, csv: string): boolean {
  if (typeof document === 'undefined') return false;
  // BOM keeps Excel from mangling non-ASCII place names.
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  return true;
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'report'
  );
}
