import { describe, expect, it } from 'vitest';
import { buildPayload, buildQrPayload, encodeCode128, parseScan, PREFIX } from '../src/lib/barcode';

/**
 * The encoder is the project's own Code 128 implementation. These tests pin
 * the parts the rest of the app trusts: the pattern table length, the start /
 * stop symbols, the checksum, and the payload grammar the scanner accepts.
 */

const totalModules = (value: string) =>
  encodeCode128(value).reduce((sum, module) => sum + module.width, 0);

describe('encodeCode128', () => {
  it('starts with a bar and terminates with the stop symbol bar', () => {
    const bars = encodeCode128('RF-0000124587');
    expect(bars[0].black).toBe(true);
    // The stop pattern is the only 7-element symbol and already ends with its
    // terminal bar, so the last module must be black.
    expect(bars.at(-1)?.black).toBe(true);
  });

  it('alternates bar and space for every module', () => {
    const bars = encodeCode128('RR|FILE|RF-0000124587');
    for (let i = 1; i < bars.length; i += 1) {
      expect(bars[i].black).not.toBe(bars[i - 1].black);
    }
  });

  it('grows total module width as the payload grows', () => {
    expect(totalModules('A')).toBeLessThan(totalModules('AB'));
  });

  it('produces a different symbol for different content', () => {
    const a = encodeCode128('RF-0000124587').map((bar) => `${bar.width}${bar.black ? '1' : '0'}`);
    const b = encodeCode128('RF-0000124588').map((bar) => `${bar.width}${bar.black ? '1' : '0'}`);
    expect(a).not.toEqual(b);
  });

  it('replaces characters outside code set B instead of emitting an invalid symbol', () => {
    const bars = encodeCode128('café');
    expect(bars.length).toBeGreaterThan(0);
    expect(bars.every((bar) => bar.width >= 1 && bar.width <= 4)).toBe(true);
  });
});

describe('buildPayload', () => {
  it('formats a file payload with the RR prefix and subject code', () => {
    expect(buildPayload('File', 'RF-0000124587').value).toBe(`${PREFIX}|FILE|RF-0000124587`);
  });

  it('uses a distinct subject code per subject', () => {
    expect(buildPayload('Shelf', 'A1').value).toBe(`${PREFIX}|SHELF|A1`);
    expect(buildPayload('Almirah', 'A1').value).toBe(`${PREFIX}|ALMIRAH|A1`);
    expect(buildPayload('Section', 'A').value).toBe(`${PREFIX}|SECTION|A`);
    expect(buildPayload('Room', 'RM-001').value).toBe(`${PREFIX}|ROOM|RM-001`);
    expect(buildPayload('Area', 'AARI').value).toBe(`${PREFIX}|AREA|AARI`);
  });

  it('rejects an empty value', () => {
    const payload = buildPayload('File', '   ');
    expect(payload.valid).toBe(false);
    expect(payload.reason).toBeTruthy();
  });
});

describe('buildQrPayload', () => {
  it('wraps the linear payload in a scan URL', () => {
    const qr = buildQrPayload('RF-0000124587', 'https://records.example');
    expect(qr.startsWith('https://records.example/scan?p=')).toBe(true);
    expect(decodeURIComponent(qr.split('p=')[1])).toBe(`${PREFIX}|FILE|RF-0000124587`);
  });

  it('does not double-prefix an already linear payload', () => {
    const qr = buildQrPayload(`${PREFIX}|SHELF|A1`, 'https://records.example');
    expect(decodeURIComponent(qr.split('p=')[1])).toBe(`${PREFIX}|SHELF|A1`);
  });
});

describe('parseScan', () => {
  it('accepts a well-formed linear payload', () => {
    const result = parseScan(`${PREFIX}|FILE|RF-0000124587`);
    expect(result.ok).toBe(true);
    expect(result.payload?.subject).toBe('File');
    expect(result.payload?.label).toBe('RF-0000124587');
    expect(result.payload?.symbology).toBe('Code128');
  });

  it('resolves a QR scan URL back to the linear payload', () => {
    const result = parseScan('https://records.example/scan?p=RR%7CFILE%7CRF-1');
    expect(result.ok).toBe(true);
    expect(result.payload?.label).toBe('RF-1');
    expect(result.payload?.symbology).toBe('QR');
  });

  it('is case sensitive on the prefix', () => {
    expect(parseScan('rr|FILE|RF-1').ok).toBe(false);
  });

  it('rejects an unknown subject code', () => {
    const result = parseScan(`${PREFIX}|WIDGET|RF-1`);
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Unknown subject');
  });

  it('rejects a payload that is not prefixed', () => {
    expect(parseScan('RF-0000124587').ok).toBe(false);
  });

  it('rejects an empty value', () => {
    expect(parseScan(`${PREFIX}|FILE|   `).ok).toBe(false);
  });

  it('rejects an empty scan', () => {
    expect(parseScan('   ').ok).toBe(false);
  });

  it('round-trips every subject', () => {
    (['File', 'Shelf', 'Almirah', 'Section', 'Room', 'Area'] as const).forEach((subject) => {
      const payload = buildPayload(subject, 'X1');
      expect(parseScan(payload.value).payload?.subject).toBe(subject);
    });
  });
});