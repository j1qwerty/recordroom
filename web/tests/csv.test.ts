import { describe, expect, it } from 'vitest';
import { escapeCsvCell, slugify, toCsv } from '../src/lib/csv';

describe('csv', () => {
  it('leaves plain cells unquoted', () => {
    expect(escapeCsvCell('RF-0000124587')).toBe('RF-0000124587');
    expect(escapeCsvCell(2021)).toBe('2021');
  });

  it('quotes cells containing a comma, quote or newline', () => {
    expect(escapeCsvCell('RM-001 / A / B')).toBe('RM-001 / A / B');
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"');
  });

  it('renders null and undefined as empty cells', () => {
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell(undefined)).toBe('');
  });

  it('emits a CRLF-delimited header plus rows', () => {
    const csv = toCsv(['Barcode', 'Year'], [['RF-1', 2021], ['RF-2', 2022]]);
    expect(csv).toBe('Barcode,Year\r\nRF-1,2021\r\nRF-2,2022');
  });

  it('handles an empty row set', () => {
    expect(toCsv(['A'], [])).toBe('A\r\n');
  });
});

describe('slugify', () => {
  it('lowercases and dashes a title', () => {
    expect(slugify('Issue register')).toBe('issue-register');
  });

  it('collapses punctuation runs and trims dashes', () => {
    expect(slugify('  Movement / log!! ')).toBe('movement-log');
  });

  it('falls back to "report" when nothing survives', () => {
    expect(slugify('///')).toBe('report');
  });
});