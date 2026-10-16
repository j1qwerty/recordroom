export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

/**
 * Repairs UTF-8 text that was mistakenly decoded as a legacy single-byte
 * encoding before it reached the UI. This is display normalization only; IDs
 * and request payloads are not rewritten by this helper.
 */
export function cleanDisplayText(value: string): string {
  return value
    .replaceAll('Ã¢â‚¬â€', '—')
    .replaceAll('Ã¢â‚¬â€œ', '–')
    .replaceAll('Ã¢â‚¬â„¢', '’')
    .replaceAll('Ã¢â‚¬Å“', '“')
    .replaceAll('Ã¢â‚¬Â', '”')
    .replaceAll('Ã‚Â·', '·')
    .replaceAll('Â·', '·')
    .replaceAll('â€”', '—')
    .replaceAll('â€¦', '…')
    .replaceAll('â€“', '–')
    .replaceAll('â€¢', '•')
    .replaceAll('Ã‚Â', '');
}
