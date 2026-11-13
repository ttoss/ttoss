import { getResponseSchema, hasQueryParameter } from './operations';
import { resolveSchema, withResolvedProperties } from './schema';
import type {
  JsonObject,
  JsonValue,
  OpenApiSchema,
  OpenApiSpec,
  ResolvedOperation,
} from './types';

const isJsonObject = (value: unknown): value is JsonObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// ─── Item schema ─────────────────────────────────────────────────────────────

/**
 * The record schema of a list operation. Handles a bare array response and a
 * paginated wrapper (`{ data: [...], total }`), taking the wrapper's first
 * array property as the list. Working from the outer schema avoids mistaking a
 * record's own array field for the list.
 */
export const getListItemSchema = ({
  operation,
  spec,
}: {
  operation: ResolvedOperation;
  spec: OpenApiSpec;
}): OpenApiSchema | undefined => {
  const schema = getResponseSchema({ operation, spec });
  if (schema?.type === 'array') {
    return withResolvedProperties({
      schema: resolveSchema({ schema: schema.items, spec }),
      spec,
    });
  }
  if (schema?.properties) {
    const arrayProp = Object.values(schema.properties)
      .map((prop) => {
        return resolveSchema({ schema: prop, spec });
      })
      .find((prop) => {
        return prop?.type === 'array';
      });
    if (arrayProp?.items) {
      return withResolvedProperties({
        schema: resolveSchema({ schema: arrayProp.items, spec }),
        spec,
      });
    }
  }
  return undefined;
};

// ─── Response data ───────────────────────────────────────────────────────────

/**
 * The records in a list response: the array itself, or the first array found
 * in a paginated wrapper object.
 */
export const extractItems = (data: unknown): JsonObject[] => {
  if (Array.isArray(data)) {
    return data.filter(isJsonObject);
  }
  if (isJsonObject(data)) {
    for (const value of Object.values(data)) {
      if (Array.isArray(value)) {
        return value.filter(isJsonObject);
      }
    }
  }
  return [];
};

const TOTAL_KEYS = ['total', 'total_count', 'totalCount', 'count'];

/**
 * The total number of records reported by a paginated wrapper, if any.
 */
export const extractTotal = (data: unknown): number | undefined => {
  if (!isJsonObject(data)) {
    return undefined;
  }
  for (const key of TOTAL_KEYS) {
    const value = data[key];
    if (typeof value === 'number') {
      return value;
    }
  }
  const meta = data.meta ?? data.pagination;
  return isJsonObject(meta) ? extractTotal(meta) : undefined;
};

// ─── Pagination ──────────────────────────────────────────────────────────────

export type ServerPagination =
  | { type: 'offset'; limitParam: string; offsetParam: string }
  | {
      type: 'page';
      pageParam: string;
      sizeParam: string;
      /** Index of the first page (0 or 1). */
      firstPage: number;
    };

const firstMatch = ({
  operation,
  names,
}: {
  operation: ResolvedOperation;
  names: string[];
}): string | undefined => {
  return names.find((name) => {
    return hasQueryParameter({ operation, name });
  });
};

/**
 * Detects server-side pagination from the operation's declared query
 * parameters: `limit` + `offset`, or `page` + a size param. Returns undefined
 * when the operation has none, in which case the table paginates client-side.
 */
export const detectServerPagination = (
  operation: ResolvedOperation
): ServerPagination | undefined => {
  const limitParam = firstMatch({
    operation,
    names: ['limit', 'page_size', 'pageSize', 'per_page', 'perPage'],
  });
  const offsetParam = firstMatch({ operation, names: ['offset', 'skip'] });
  if (limitParam && offsetParam) {
    return { type: 'offset', limitParam, offsetParam };
  }
  const pageParam = firstMatch({ operation, names: ['page'] });
  if (pageParam && limitParam) {
    const pageSchema = operation.operation.parameters?.find((param) => {
      return param.name === pageParam;
    })?.schema;
    return {
      type: 'page',
      pageParam,
      sizeParam: limitParam,
      firstPage: pageSchema?.minimum === 0 ? 0 : 1,
    };
  }
  return undefined;
};

/**
 * The query params that request one page from the server.
 */
export const paginationParams = ({
  pagination,
  pageIndex,
  pageSize,
}: {
  pagination: ServerPagination;
  pageIndex: number;
  pageSize: number;
}): Record<string, number> => {
  if (pagination.type === 'offset') {
    return {
      [pagination.limitParam]: pageSize,
      [pagination.offsetParam]: pageIndex * pageSize,
    };
  }
  return {
    [pagination.sizeParam]: pageSize,
    [pagination.pageParam]: pageIndex + pagination.firstPage,
  };
};

// ─── Columns ─────────────────────────────────────────────────────────────────

const SENSITIVE_KEYS = /secret|password|passwd|api_?key|token|credential/i;

export const isSensitiveKey = (key: string): boolean => {
  return SENSITIVE_KEYS.test(key);
};

export const isSensitiveField = ({
  key,
  schema,
}: {
  key: string;
  schema?: OpenApiSchema;
}): boolean => {
  return schema?.['x-sensitive'] === true || isSensitiveKey(key);
};

export const humanizeKey = (key: string): string => {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => {
      return char.toUpperCase();
    });
};

export const DEFAULT_MAX_COLUMNS = 6;

const isScalarSchema = (schema: OpenApiSchema): boolean => {
  return schema.type !== 'object' && schema.type !== 'array';
};

/**
 * The column keys a table shows when the caller does not choose them: the
 * item schema's properties in declaration order, scalar fields first, without
 * sensitive fields. Falls back to the keys of the loaded records when the spec
 * describes no item schema.
 */
export const deriveColumns = ({
  itemSchema,
  items = [],
  maxColumns = DEFAULT_MAX_COLUMNS,
}: {
  itemSchema?: OpenApiSchema;
  items?: JsonObject[];
  maxColumns?: number;
}): string[] => {
  const properties = itemSchema?.properties;
  if (properties && Object.keys(properties).length > 0) {
    const visible = Object.entries(properties).filter(([key, schema]) => {
      return !isSensitiveField({ key, schema });
    });
    const scalar = visible.filter(([, schema]) => {
      return isScalarSchema(schema);
    });
    const complex = visible.filter(([, schema]) => {
      return !isScalarSchema(schema);
    });
    return [...scalar, ...complex].slice(0, maxColumns).map(([key]) => {
      return key;
    });
  }
  const keys = Array.from(
    new Set(
      items.flatMap((item) => {
        return Object.keys(item);
      })
    )
  );
  return keys
    .filter((key) => {
      return !isSensitiveKey(key);
    })
    .slice(0, maxColumns);
};

// ─── Cells ───────────────────────────────────────────────────────────────────

export type CellKind =
  | 'empty'
  | 'sensitive'
  | 'boolean'
  | 'number'
  | 'date'
  | 'datetime'
  | 'status'
  | 'list'
  | 'record'
  | 'json'
  | 'text';

const isScalar = (value: unknown): boolean => {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  );
};

const MAX_RECORD_KEYS = 8;

const DATETIME_KEY = /(_at|At)$/;

const STATUS_KEY = /^(status|state)$/i;

const isEmptyValue = (value: JsonValue | undefined): boolean => {
  return value === null || value === undefined || value === '';
};

/** Arrays and objects: a short scalar list or record, or raw JSON. */
const structuredKind = (value: JsonValue[] | JsonObject): CellKind => {
  if (Array.isArray(value)) {
    return value.every(isScalar) ? 'list' : 'json';
  }
  const entries = Object.values(value);
  return entries.length <= MAX_RECORD_KEYS && entries.every(isScalar)
    ? 'record'
    : 'json';
};

type ScalarArgs = { key: string; value: JsonValue; schema: OpenApiSchema };

const isValidDate = (value: JsonValue): boolean => {
  return !Number.isNaN(Date.parse(String(value)));
};

/**
 * Scalar kinds in priority order: schema type and format first, then the
 * runtime value, then the key (`created_at`, `status`).
 */
const SCALAR_RULES: [CellKind, (args: ScalarArgs) => boolean][] = [
  [
    'boolean',
    ({ value, schema }) => {
      return schema.type === 'boolean' || typeof value === 'boolean';
    },
  ],
  [
    'number',
    ({ value, schema }) => {
      return (
        schema.type === 'number' ||
        schema.type === 'integer' ||
        typeof value === 'number'
      );
    },
  ],
  [
    'date',
    ({ schema }) => {
      return schema.format === 'date';
    },
  ],
  [
    'datetime',
    ({ key, value, schema }) => {
      const declared =
        schema.format === 'date-time' ||
        (!schema.format && DATETIME_KEY.test(key));
      return declared && isValidDate(value);
    },
  ],
  [
    'status',
    ({ key, schema }) => {
      return !!schema.enum || STATUS_KEY.test(key);
    },
  ],
];

const scalarKind = (args: ScalarArgs): CellKind => {
  const match = SCALAR_RULES.find(([, test]) => {
    return test(args);
  });
  return match ? match[0] : 'text';
};

/**
 * How a cell should be presented, decided from the field's schema first and
 * from its key and runtime value when the schema says nothing.
 */
export const getCellKind = ({
  key,
  value,
  schema,
}: {
  key: string;
  value: JsonValue | undefined;
  schema?: OpenApiSchema;
}): CellKind => {
  if (isSensitiveField({ key, schema })) {
    return 'sensitive';
  }
  if (value === undefined || isEmptyValue(value)) {
    return 'empty';
  }
  if (typeof value === 'object' && value !== null) {
    return structuredKind(value);
  }
  return scalarKind({ key, value, schema: schema ?? {} });
};

export type StatusTone = 'success' | 'danger' | 'warning' | 'neutral' | 'info';

const TONES: Record<Exclude<StatusTone, 'neutral'>, Set<string>> = {
  success: new Set([
    'active',
    'approved',
    'completed',
    'complete',
    'done',
    'enabled',
    'ok',
    'paid',
    'ready',
    'success',
    'succeeded',
  ]),
  danger: new Set([
    'cancelled',
    'canceled',
    'error',
    'expired',
    'failed',
    'failure',
    'rejected',
    'revoked',
  ]),
  warning: new Set([
    'pending',
    'processing',
    'queued',
    'running',
    'waiting',
    'in_progress',
  ]),
  info: new Set(['draft', 'new', 'open', 'scheduled']),
};

/**
 * The colour tone conveying a status value: green for healthy, red for
 * failure, amber for in-flight, blue for not-yet-started, grey otherwise.
 */
export const statusTone = (status: string): StatusTone => {
  const key = status
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  for (const [tone, values] of Object.entries(TONES)) {
    if (values.has(key)) {
      return tone as StatusTone;
    }
  }
  return 'neutral';
};

// ─── Search ──────────────────────────────────────────────────────────────────

/**
 * Case-insensitive match of a free-text query against a record's scalar
 * values. Sensitive fields are never searched.
 */
export const matchesSearch = ({
  item,
  query,
}: {
  item: JsonObject;
  query: string;
}): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return Object.entries(item).some(([key, value]) => {
    return (
      !isSensitiveKey(key) &&
      (typeof value === 'string' || typeof value === 'number') &&
      String(value).toLowerCase().includes(q)
    );
  });
};
