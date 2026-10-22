import { describe, expect, it } from 'vitest';
import { cleanDisplayText, formatNumber } from '../src/lib/utils';

describe('utils', () => {
  it('formats Indian numeric grouping', () => {
    expect(formatNumber(2478450)).toBe('24,78,450');
  });

  it('normalizes common UTF-8 decoding artifacts in display labels', () => {
    expect(cleanDisplayText('FILE Ã‚Â· FL-01 Ã‚Â· 3')).toBe('FILE · FL-01 · 3');
    expect(cleanDisplayText('Page 1 â€” latest â€¦')).toBe('Page 1 — latest …');
  });
});
