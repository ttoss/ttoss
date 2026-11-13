import type { FieldKind, FormField } from './form';
import type { JsonObject, JsonValue } from './types';

// ─── Values ──────────────────────────────────────────────────────────────────

/** What an input holds while the user edits it. */
export type FormValue = string | boolean | string[] | File | null;

export type FormValues = Record<string, FormValue>;

const pad = (n: number) => {
  return String(n).padStart(2, '0');
};

/** ISO timestamp → the local `YYYY-MM-DDTHH:mm` a datetime-local input takes. */
const toDatetimeLocal = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const isNil = (value: JsonValue | undefined): value is null | undefined => {
  return value === undefined || value === null;
};

const INPUT_CONVERTERS: Partial<
  Record<FieldKind, (value: JsonValue | undefined) => FormValue>
> = {
  boolean: (value) => {
    return value === true;
  },
  multiEnum: (value) => {
    return Array.isArray(value) ? value.map(String) : [];
  },
  file: () => {
    return null;
  },
  json: (value) => {
    return isNil(value) ? '' : JSON.stringify(value, null, 2);
  },
  datetime: (value) => {
    return typeof value === 'string' ? toDatetimeLocal(value) : '';
  },
  date: (value) => {
    return typeof value === 'string' ? value.slice(0, 10) : '';
  },
};

const toInputValue = ({
  field,
  value,
}: {
  field: FormField;
  value: JsonValue | undefined;
}): FormValue => {
  const convert = INPUT_CONVERTERS[field.kind];
  if (convert) {
    return convert(value);
  }
  return isNil(value) ? '' : String(value);
};

/**
 * The initial input values: the record being edited when there is one, the
 * schema `default` otherwise.
 */
export const initFormValues = ({
  fields,
  record,
}: {
  fields: FormField[];
  record?: JsonObject;
}): FormValues => {
  const values: FormValues = {};
  for (const field of fields) {
    const value =
      record && field.name in record
        ? record[field.name]
        : field.schema.default;
    values[field.name] = toInputValue({ field, value });
  }
  return values;
};

// ─── Validation & body ───────────────────────────────────────────────────────

export type FieldError =
  | { code: 'required' }
  | { code: 'invalidNumber' }
  | { code: 'notInteger' }
  | { code: 'minimum'; limit: number }
  | { code: 'maximum'; limit: number }
  | { code: 'minLength'; limit: number }
  | { code: 'maxLength'; limit: number }
  | { code: 'pattern' }
  | { code: 'invalidJson' }
  | { code: 'jsonType'; expected: 'object' | 'array' };

type Parsed =
  | { ok: true; empty: true }
  | { ok: true; empty: false; value: JsonValue | File }
  | { ok: false; error: FieldError };

const isEmptyValue = (value: FormValue): boolean => {
  return (
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
};

const parseNumber = (field: FormField, raw: string): Parsed => {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return { ok: false, error: { code: 'invalidNumber' } };
  }
  if (field.kind === 'integer' && !Number.isInteger(value)) {
    return { ok: false, error: { code: 'notInteger' } };
  }
  const { minimum, maximum } = field.schema;
  if (minimum !== undefined && value < minimum) {
    return { ok: false, error: { code: 'minimum', limit: minimum } };
  }
  if (maximum !== undefined && value > maximum) {
    return { ok: false, error: { code: 'maximum', limit: maximum } };
  }
  return { ok: true, empty: false, value };
};

const parseJson = (field: FormField, raw: string): Parsed => {
  let value: JsonValue;
  try {
    value = JSON.parse(raw) as JsonValue;
  } catch {
    return { ok: false, error: { code: 'invalidJson' } };
  }
  const expected = field.schema.type === 'array' ? 'array' : 'object';
  const isArray = Array.isArray(value);
  const matches =
    expected === 'array'
      ? isArray
      : typeof value === 'object' && value !== null && !isArray;
  if (!matches) {
    return { ok: false, error: { code: 'jsonType', expected } };
  }
  return { ok: true, empty: false, value };
};

const parseString = (field: FormField, raw: string): Parsed => {
  const { minLength, maxLength, pattern } = field.schema;
  if (minLength !== undefined && raw.length < minLength) {
    return { ok: false, error: { code: 'minLength', limit: minLength } };
  }
  if (maxLength !== undefined && raw.length > maxLength) {
    return { ok: false, error: { code: 'maxLength', limit: maxLength } };
  }
  if (pattern) {
    try {
      if (!new RegExp(pattern, 'u').test(raw)) {
        return { ok: false, error: { code: 'pattern' } };
      }
    } catch {
      // A pattern the browser cannot compile is left to the server.
    }
  }
  if (field.kind === 'datetime') {
    const date = new Date(raw);
    return {
      ok: true,
      empty: false,
      value: Number.isNaN(date.getTime()) ? raw : date.toISOString(),
    };
  }
  return { ok: true, empty: false, value: raw };
};

/**
 * Converts one input value to its JSON value, validating it against the
 * field's schema.
 */
export const parseFieldValue = ({
  field,
  value,
}: {
  field: FormField;
  value: FormValue;
}): Parsed => {
  if (field.kind === 'boolean') {
    return { ok: true, empty: false, value: value === true };
  }
  if (isEmptyValue(value)) {
    return field.required
      ? { ok: false, error: { code: 'required' } }
      : { ok: true, empty: true };
  }
  if (value instanceof File) {
    return { ok: true, empty: false, value };
  }
  if (Array.isArray(value)) {
    return { ok: true, empty: false, value };
  }
  const raw = String(value);
  switch (field.kind) {
    case 'integer':
    case 'number':
      return parseNumber(field, raw.trim());
    case 'json':
      return parseJson(field, raw);
    default:
      return parseString(field, raw);
  }
};

export type BuildBodyResult =
  | { ok: true; body: Record<string, JsonValue | File> }
  | { ok: false; errors: Record<string, FieldError> };

const isUnchanged = ({
  initial,
  name,
  value,
}: {
  initial?: FormValues;
  name: string;
  value: FormValue;
}): boolean => {
  return (
    !!initial &&
    !(value instanceof File) &&
    JSON.stringify(initial[name]) === JSON.stringify(value)
  );
};

/**
 * Validates every field and builds the request body. In `patch` mode only
 * fields that differ from `initial` are sent, and a cleared field is sent as
 * `null`; otherwise empty optional fields are left out.
 */
export const buildRequestBody = ({
  fields,
  values,
  initial,
  patch = false,
}: {
  fields: FormField[];
  values: FormValues;
  initial?: FormValues;
  patch?: boolean;
}): BuildBodyResult => {
  const body: Record<string, JsonValue | File> = {};
  const errors: Record<string, FieldError> = {};
  for (const field of fields) {
    const value = values[field.name] ?? null;
    if (patch && isUnchanged({ initial, name: field.name, value })) {
      continue;
    }
    const parsed = parseFieldValue({ field, value });
    if (!parsed.ok) {
      errors[field.name] = parsed.error;
    } else if (!parsed.empty) {
      body[field.name] = parsed.value;
    } else if (patch) {
      body[field.name] = null;
    }
  }
  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, body };
};

/**
 * A multipart body: files appended as-is, objects as JSON strings, the rest
 * as their string form.
 */
export const toFormData = (
  body: Record<string, JsonValue | File>
): FormData => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(body)) {
    if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        formData.append(key, String(item));
      }
    } else if (typeof value === 'object' && value !== null) {
      formData.append(key, JSON.stringify(value));
    } else if (value !== null) {
      formData.append(key, String(value));
    }
  }
  return formData;
};
