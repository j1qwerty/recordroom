/**
 * HTTP transport for the .NET 10 API.
 *
 * Two jobs, kept apart on purpose:
 *
 * - `get` / `send` throw on failure. Used by reads, where `useQuery` turns the
 *   rejection into an error state the page can render.
 * - `attempt` returns a `Result<T>` instead. Used by writes, because the
 *   contract models a refused write (duplicate barcode, full shelf, role denied)
 *   as a value to render against a field, not as an exception to propagate.
 *
 * The API answers with `{ success, data, errors }`. Unwrapping that envelope
 * here means no adapter above this file has to know it exists.
 */

import { err, ok, type FieldIssue, type Result } from '../contracts';

const BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5199').replace(/\/+$/, '');
const TOKEN_KEY = 'rr-token';

/** Thrown for transport-level failures and non-2xx responses. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface FieldError {
  message: string;
  field?: string | null;
}

interface Envelope<T> {
  success: boolean;
  data: T | null;
  errors: FieldError[] | null;
}

/**
 * Storage access that tolerates a missing DOM.
 *
 * The module is imported by `services/index.ts`, which the unit tests load in a
 * node environment where `localStorage` does not exist. Reading it at module
 * scope would throw on import and take the whole suite with it, so every access
 * goes through here.
 */
const storage = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    // Some browsers throw on access when storage is blocked by policy.
    return null;
  }
};

const readStored = (key: string): string | null => {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const writeStored = (key: string, value: string | null): void => {
  try {
    const store = storage();
    if (!store) return;
    if (value === null) store.removeItem(key);
    else store.setItem(key, value);
  } catch {
    /* a full or blocked quota must not break sign-in */
  }
};

let token: string | null = readStored(TOKEN_KEY);

export function setToken(next: string | null): void {
  token = next;
  writeStored(TOKEN_KEY, next);
}

export function getToken(): string | null {
  return token;
}

export function apiBase(): string {
  return BASE;
}

function authHeader(): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** An expired or revoked token must not leave the shell rendering as signed in. */
function handleUnauthorized(): void {
  setToken(null);
}

async function parse(response: Response): Promise<Envelope<unknown>> {
  const text = await response.text();
  if (text.length === 0) return { success: response.ok, data: null, errors: null };

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new ApiError(
      response.status,
      `The API returned a non-JSON response (${response.status}).`,
    );
  }

  return normalise(payload, response.ok);
}

/**
 * Coerces a response body into the one envelope shape the callers understand.
 *
 * The API is configured to answer a model-binding failure with the same
 * `ApiResponse` envelope as a service refusal, so this is belt and braces for
 * anything that still slips through - a framework-level 400, an antiforgery or
 * auth middleware response, or a body served by something that is not this API.
 *
 * Without it the fall-through is silent: `errors[0].message` is read to attach
 * a message to a specific input, and a body with a different shape yields no
 * field error at all, so the user sees only "Request failed (400)".
 */
function normalise(payload: unknown, ok: boolean): Envelope<unknown> {
  if (payload !== null && typeof payload === 'object') {
    const body = payload as Record<string, unknown>;

    // Already the app envelope.
    if (typeof body.success === 'boolean') {
      return {
        success: body.success,
        data: (body.data ?? null) as unknown,
        errors: (body.errors as FieldError[] | null) ?? null,
      };
    }

    // RFC 7807 / RFC 9110 problem details: { title, errors: { Field: [msg] } }.
    // `errors` may also be an array of { message } without a field.
    const raw = body.errors;
    const collected: FieldError[] = [];

    if (Array.isArray(raw)) {
      for (const entry of raw) {
        if (entry && typeof entry === 'object') {
          const e = entry as Record<string, unknown>;
          const message =
            typeof e.message === 'string'
              ? e.message
              : typeof e.title === 'string'
                ? e.title
                : null;
          if (message) {
            collected.push({ message, field: typeof e.field === 'string' ? e.field : null });
          }
        }
      }
    } else if (raw !== null && typeof raw === 'object') {
      for (const [field, value] of Object.entries(raw as Record<string, unknown>)) {
        const messages = Array.isArray(value) ? value : [value];
        for (const message of messages) {
          if (typeof message === 'string') collected.push({ message, field });
        }
      }
    }

    if (collected.length > 0) return { success: false, data: null, errors: collected };

    if (typeof body.title === 'string') {
      return { success: false, data: null, errors: [{ message: body.title, field: null }] };
    }
  }

  return { success: ok, data: ok ? payload : null, errors: null };
}

async function raw(path: string, method: string, body?: unknown): Promise<Response> {
  try {
    return await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...authHeader(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    // fetch only rejects on a network-level failure, which for this app almost
    // always means the API is not running.
    throw new ApiError(
      0,
      `Cannot reach the record-room API at ${BASE}. Is it running? (${
        cause instanceof Error ? cause.message : String(cause)
      })`,
    );
  }
}

/**
 * Performs a request and unwraps the envelope, throwing on refusal.
 *
 * Use this for reads: a failed read is an error state, not a value.
 */
export async function get<T>(path: string): Promise<T> {
  return unwrap<T>(await raw(path, 'GET'));
}

/** As `get`, for a request that carries a body and expects a 200 either way. */
export async function send<T>(
  method: 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  return unwrap<T>(await raw(path, method, body));
}

/**
 * A read expressed as a POST body.
 *
 * The `validate` endpoints take a payload to check rather than an id to fetch,
 * and they answer 200 with the list of problems rather than refusing.
 */
export async function post<T>(path: string, body: unknown): Promise<T> {
  return unwrap<T>(await raw(path, 'POST', body));
}

async function unwrap<T>(response: Response): Promise<T> {
  const envelope = await parse(response);

  if (response.status === 401) {
    handleUnauthorized();
    throw new ApiError(401, 'Your session has expired. Sign in again.');
  }

  if (!envelope.success) {
    const first = envelope.errors?.[0];
    throw new ApiError(response.status, first?.message ?? `Request failed (${response.status}).`);
  }

  // A 403 has no envelope at all: the endpoint is authorized but the role is
  // not permitted, and authorization runs before the handler.
  if (!response.ok) {
    throw new ApiError(
      response.status,
      response.status === 403
        ? 'Your role does not permit that action.'
        : `Request failed (${response.status}).`,
    );
  }

  return envelope.data as T;
}

/**
 * Performs a write and converts a refusal into a `Result`.
 *
 * Field-level messages survive, because the UI attaches them to individual
 * inputs rather than showing a banner.
 */
export async function attempt<T>(
  method: 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<Result<T>> {
  const response = await raw(path, method, body);

  if (response.status === 401) {
    handleUnauthorized();
    return err('Your session has expired. Sign in again.');
  }

  const envelope = await parse(response);

  if (envelope.success && response.ok) return ok(envelope.data as T);

  const first = envelope.errors?.[0];
  if (first) return err(first.message, first.field ?? undefined);

  if (response.status === 403) return err('Your role does not permit that action.');
  return err(`Request failed (${response.status}).`);
}

/** Multipart writes must not set Content-Type manually; fetch supplies the boundary. */
export async function attemptForm<T>(path: string, body: FormData): Promise<Result<T>> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, { method: 'POST', headers: authHeader(), body });
  } catch (cause) {
    return err<T>(
      `Cannot reach the record-room API at ${BASE}. Is it running? (${
        cause instanceof Error ? cause.message : String(cause)
      })`,
    );
  }
  if (response.status === 401) {
    handleUnauthorized();
    return err<T>('Your session has expired. Sign in again.');
  }
  let envelope: Envelope<unknown>;
  try {
    envelope = await parse(response);
  } catch (cause) {
    return err<T>(cause instanceof Error ? cause.message : 'The upload response was invalid.');
  }
  if (response.ok && envelope.success) return ok<T>(envelope.data as T);
  const first = envelope.errors?.[0];
  if (first) return err<T>(first.message, first.field ?? undefined);
  if (response.status === 403) return err<T>('Your role does not permit that action.');
  return err<T>(`Upload failed (${response.status}).`);
}

/** Fetches private document bytes with the current bearer token. */
export async function getBlob(path: string): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, { headers: authHeader() });
  } catch (cause) {
    throw new ApiError(
      0,
      `Cannot reach the record-room API at ${BASE}. Is it running? (${
        cause instanceof Error ? cause.message : String(cause)
      })`,
    );
  }
  if (response.status === 401) {
    handleUnauthorized();
    throw new ApiError(401, 'Your session has expired. Sign in again.');
  }
  if (!response.ok) {
    let message =
      response.status === 403
        ? 'Your role does not permit that action.'
        : `Document request failed (${response.status}).`;
    try {
      const text = await response.text();
      if (text) {
        const data = JSON.parse(text) as {
          errors?: Array<{ message?: string }>;
          detail?: string;
          title?: string;
        };
        message = data.errors?.[0]?.message ?? data.detail ?? data.title ?? message;
      }
    } catch {
      // Preserve the status-derived message for non-JSON errors.
    }
    throw new ApiError(response.status, message);
  }
  return response.blob();
}

/** Reads a `validate` endpoint that answers 200 with a body describing failures. */
export function toFieldIssues(errors: FieldError[] | null | undefined): FieldIssue[] {
  return (errors ?? []).map((entry) => ({
    field: entry.field ?? '',
    message: entry.message,
    severity: 'error' as const,
  }));
}

// ------------------------------------------------------------------- query

export type QueryValue = string | number | boolean | undefined | null;

/**
 * Builds a query string, dropping empty values.
 *
 * `'All'` is meaningful to the API and must survive; empty strings and
 * undefined are not filters and must not be sent as `?status=`.
 */
export function qs(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

// -------------------------------------------------------------- id mapping

/**
 * The frontend types use string ids; the API uses integers.
 *
 * Keeping the conversion here means no adapter or page has to remember it, and
 * a non-numeric id fails loudly at the boundary instead of silently becoming
 * `NaN` in a request path.
 */
export function toId(value: number | string): string {
  return String(value);
}

export function toApiId(value: string, field: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ApiError(0, `"${value}" is not a valid ${field} id.`);
  }
  return parsed;
}
