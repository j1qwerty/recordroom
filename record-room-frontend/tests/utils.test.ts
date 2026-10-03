import { describe, expect, it } from 'vitest';
import { formatNumber } from '../src/lib/utils';

describe('utils', () => {
  it('formats Indian numeric grouping', () => {
    expect(formatNumber(2478450)).toBe('24,78,450');
  });
});
