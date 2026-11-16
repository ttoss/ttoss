import { OpenApiRequestError } from '../fetcher';

export type ServerFieldErrors = Record<string, string>;

type ErrorEntry = Record<string, unknown> | null;

const entryName = (entry: Record<string, unknown>): string | undefined => {
  const path = entry.field ?? entry.path ?? entry.name;
  const name = Array.isArray(path) ? path.join('.') : path;
  return typeof name === 'string' ? name : undefined;
};

/** `[{ field|path|name, message }]`, where a path may be an array. */
const fromList = (entries: ErrorEntry[]): ServerFieldErrors => {
  const result: ServerFieldErrors = {};
  for (const entry of entries) {
    const name = entryName(entry ?? {});
    if (name && typeof entry?.message === 'string') {
      result[name] = entry.message;
    }
  }
  return result;
};

/** `{ name: 'msg' }` or `{ name: ['msg', …] }`. */
const fromRecord = (record: Record<string, unknown>): ServerFieldErrors => {
  const result: ServerFieldErrors = {};
  for (const [name, message] of Object.entries(record)) {
    const text = Array.isArray(message) ? message[0] : message;
    if (typeof text === 'string') {
      result[name] = text;
    }
  }
  return result;
};

/**
 * Field errors an API returned, in the shapes APIs commonly use:
 * `{ errors: { name: 'msg' } }` or `{ errors: [{ field|path|name, message }] }`
 * (also under `fieldErrors` or `field_errors`).
 */
export const extractServerFieldErrors = (error: unknown): ServerFieldErrors => {
  if (!(error instanceof OpenApiRequestError)) {
    return {};
  }
  const body = error.body as Record<string, unknown> | null;
  const raw = body?.errors ?? body?.fieldErrors ?? body?.field_errors;
  if (Array.isArray(raw)) {
    return fromList(raw as ErrorEntry[]);
  }
  if (raw && typeof raw === 'object') {
    return fromRecord(raw as Record<string, unknown>);
  }
  return {};
};
