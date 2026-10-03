/**
 * Code 128 symbology encoder and record-room payload format.
 *
 * Payload grammar (also documented in `docs/FRONTEND-SPEC.md`):
 *
 *   RR|<SUBJECT>|<VALUE>          linear Code 128 label
 *   https://<host>/scan?p=<url-encoded Code128 payload>   QR sticker
 *
 * The legacy app printed barcodes server-side with FPDF and never validated a
 * scanned string, so the scan endpoint is new behaviour the .NET 10 API will
 * own. The parser below is the client-side mirror of that contract.
 */

import type { BarcodePayload, BarcodeSubject, ScanResult } from '../types';

const CODE128_PATTERNS = [
  '212222',
  '222122',
  '222221',
  '121223',
  '121322',
  '131222',
  '122213',
  '122312',
  '132212',
  '221213',
  '221312',
  '231212',
  '112232',
  '122132',
  '122231',
  '113222',
  '123122',
  '123221',
  '223211',
  '221132',
  '221231',
  '213212',
  '223112',
  '312131',
  '311222',
  '321122',
  '321221',
  '312212',
  '322112',
  '322211',
  '212123',
  '212321',
  '232121',
  '111323',
  '131123',
  '131321',
  '112313',
  '132113',
  '132311',
  '211313',
  '231113',
  '231311',
  '112133',
  '112331',
  '132131',
  '113123',
  '113321',
  '133121',
  '313121',
  '211331',
  '231131',
  '213113',
  '213311',
  '213131',
  '311123',
  '311321',
  '331121',
  '312113',
  '312311',
  '332111',
  '314111',
  '221411',
  '431111',
  '111224',
  '111422',
  '121124',
  '121421',
  '141122',
  '141221',
  '112214',
  '112412',
  '122114',
  '122411',
  '142112',
  '142211',
  '241211',
  '221114',
  '413111',
  '241112',
  '134111',
  '111242',
  '121142',
  '121241',
  '114212',
  '124112',
  '124211',
  '411212',
  '421112',
  '421211',
  '212141',
  '214121',
  '412121',
  '111143',
  '111341',
  '131141',
  '114113',
  '114311',
  '411113',
  '411311',
  '113141',
  '114131',
  '311141',
  '411131',
  '211412',
  '211214',
  '211232',
  '2331112',
];

const START_B = 104;
const STOP = 106;

export interface BarModule {
  /** Width in modules (1 unit = the narrowest bar). */
  width: number;
  black: boolean;
}

/**
 * Encodes text as Code 128 (code set B). Characters outside the printable
 * ASCII range of set B are replaced so the encoder never emits an invalid
 * symbol for a barcode that came out of a text field.
 */
export function encodeCode128(input: string): BarModule[] {
  const text = input.replace(/[^\x20-\x7e]/g, '?');
  const values = [START_B, ...[...text].map((char) => char.charCodeAt(0) - 32)];

  let checksum = values[0];
  for (let i = 1; i < values.length; i += 1) checksum += values[i] * i;
  values.push(checksum % 103);
  values.push(STOP);

  const bars: BarModule[] = [];
  values.forEach((value, index) => {
    const pattern = CODE128_PATTERNS[value];
    if (!pattern) return;
    let black = true;
    for (const width of pattern) {
      bars.push({ width: Number(width), black });
      black = !black;
    }
    // A stop pattern terminates the symbol with a final bar.
    if (index === values.length - 1) bars.push({ width: 2, black: true });
  });

  return bars;
}

export const SUBJECTS: BarcodeSubject[] = ['File', 'Shelf', 'Almirah', 'Section', 'Room', 'Area'];

const SUBJECT_CODES: Record<BarcodeSubject, string> = {
  File: 'FILE',
  Shelf: 'SHELF',
  Almirah: 'ALMIRAH',
  Section: 'SECTION',
  Room: 'ROOM',
  Area: 'AREA',
};

const SUBJECT_BY_CODE: Record<string, BarcodeSubject> = Object.entries(SUBJECT_CODES).reduce(
  (acc, [subject, code]) => {
    acc[code] = subject as BarcodeSubject;
    return acc;
  },
  {} as Record<string, BarcodeSubject>,
);

export const PREFIX = 'RR';

/** Builds the linear label payload for a subject. */
export function buildPayload(
  subject: BarcodeSubject,
  value: string,
  label = value,
): BarcodePayload {
  const clean = value.trim();
  if (!clean) {
    return {
      subject,
      symbology: 'Code128',
      value: '',
      label,
      meta: '',
      valid: false,
      reason: 'A payload value is required.',
    };
  }
  return {
    subject,
    symbology: 'Code128',
    value: `${PREFIX}|${SUBJECT_CODES[subject]}|${clean}`,
    label,
    meta: `Code 128 · set B · ${clean.length} chars`,
    valid: true,
  };
}

/** Builds the QR sticker payload that resolves back to the scan route. */
export function buildQrPayload(value: string, origin?: string): string {
  const base =
    origin ?? (typeof window === 'undefined' ? 'https://records.local' : window.location.origin);
  const linear = value.startsWith(`${PREFIX}|`) ? value : `${PREFIX}|FILE|${value.trim()}`;
  return `${base}/scan?p=${encodeURIComponent(linear)}`;
}

/** Mirrors the future `/api/barcodes/validate` endpoint. */
export function parseScan(rawInput: string, origin?: string): ScanResult {
  const input = rawInput.trim();
  if (!input) return { ok: false, payload: null, message: 'Nothing scanned yet.' };

  // QR form: resolve it back to the linear payload first.
  const normalised =
    input.startsWith('http') || input.startsWith('/scan')
      ? (new URL(input, 'https://placeholder.invalid').searchParams.get('p') ?? input)
      : input;

  const parts = normalised.split('|');
  if (parts.length !== 3 || parts[0] !== PREFIX) {
    return {
      ok: false,
      payload: null,
      message: `Unrecognised payload. Expected ${PREFIX}|SUBJECT|VALUE.`,
    };
  }

  const subject = SUBJECT_BY_CODE[parts[1]];
  if (!subject) {
    return { ok: false, payload: null, message: `Unknown subject code "${parts[1]}".` };
  }

  const value = parts[2].trim();
  if (!value) return { ok: false, payload: null, message: 'Payload carries an empty value.' };

  const fromQr = input.startsWith('http') || input.startsWith('/scan');
  return {
    ok: true,
    payload: {
      subject,
      symbology: fromQr ? 'QR' : 'Code128',
      value: normalised,
      label: value,
      meta: fromQr
        ? `QR resolved from ${buildQrPayload(value, origin).length} chars`
        : `Code 128 · set B · ${value.length} chars`,
      valid: true,
    },
    message: `${subject} payload accepted.`,
  };
}
