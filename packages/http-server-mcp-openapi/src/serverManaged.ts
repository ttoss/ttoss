import type { ServerManagedParameter } from './types';

/** One extension name, or several that all mean "the server sets this". */
export type ServerManagedExtension = string | string[];

/**
 * Whether a parameter or body property carries one of the server-managed
 * extensions, and the value it pins when the extension is a string.
 *
 * A string pins the value (`x-mcp-server-managed: 'true'` always sends
 * `true`); any other truthy value only hides it. The first matching name wins.
 */
export const readServerManaged = (args: {
  node: Record<string, unknown>;
  extension: ServerManagedExtension;
}): { managed: boolean; value?: string } => {
  const names = Array.isArray(args.extension)
    ? args.extension
    : [args.extension];
  for (const name of names) {
    const flag = args.node[name];
    if (typeof flag === 'string') return { managed: true, value: flag };
    if (flag) return { managed: true };
  }
  return { managed: false };
};

/** The args each pinned parameter is always sent with, keyed by `argName`. */
export const pinnedArgs = (
  parameters: ServerManagedParameter[]
): Record<string, string> => {
  const pinned: Record<string, string> = {};
  for (const parameter of parameters) {
    if (parameter.value !== undefined) {
      pinned[parameter.argName] = parameter.value;
    }
  }
  return pinned;
};

/**
 * Wraps a `path` / `query` builder so pinned values replace whatever the args
 * carry. Applied in the builder itself, so every consumer of the tool
 * definition sends them, not only `openApiToTools`.
 */
export const withPinned = <T>(args: {
  build: ((values: Record<string, unknown>) => T) | undefined;
  pinned: Record<string, string>;
}): ((values: Record<string, unknown>) => T) | undefined => {
  const { build, pinned } = args;
  if (!build || Object.keys(pinned).length === 0) return build;
  return (values) => {
    return build({ ...values, ...pinned });
  };
};

const parseNumber = (value: string): number | undefined => {
  const parsed = Number(value);
  return value.trim() !== '' && Number.isFinite(parsed) ? parsed : undefined;
};

/** Each JSON type a pin can hold, and how its text reads as that type. */
const PIN_PARSERS: Record<
  string,
  (value: string) => string | number | boolean | undefined
> = {
  string: (value) => {
    return value;
  },
  boolean: (value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  },
  number: parseNumber,
  integer: (value) => {
    const parsed = parseNumber(value);
    return parsed !== undefined && Number.isInteger(parsed)
      ? parsed
      : undefined;
  },
};

/**
 * Reads a pinned body value as the JSON type its schema declares. A body is
 * JSON, so `'true'` on a boolean must reach the API as `true`; a query string
 * carries the text either way. A pin the type cannot hold is a spec error.
 */
export const typedPin = (args: {
  value: string;
  type: unknown;
  /** Names the operation and property in the error. */
  where: string;
}): string | number | boolean => {
  const { value, type, where } = args;
  const parser = typeof type === 'string' ? PIN_PARSERS[type] : undefined;
  const typed = parser?.(value);
  if (typed !== undefined) return typed;
  throw new Error(
    `${where}: cannot pin '${value}' on a property of type ${JSON.stringify(type ?? 'any')}; ` +
      'a pinned body property must be a boolean, integer, number or string that holds the value.'
  );
};

/**
 * Wraps a `body` builder so pinned values replace whatever the args carry. An
 * operation whose only body properties are pinned still gets a builder.
 */
export const withPinnedBody = (args: {
  build:
    ((values: Record<string, unknown>) => Record<string, unknown>) | undefined;
  pinned: Record<string, unknown>;
}):
  | ((values: Record<string, unknown>) => Record<string, unknown>)
  | undefined => {
  const { build, pinned } = args;
  if (Object.keys(pinned).length === 0) return build;
  return (values) => {
    return { ...(build ? build(values) : {}), ...pinned };
  };
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const mergeNullIntoType = (schema: Record<string, unknown>): void => {
  const { type } = schema;
  if (typeof type === 'string') {
    schema.type = [type, 'null'];
  } else if (Array.isArray(type) && !type.includes('null')) {
    schema.type = [...type, 'null'];
  }
};

/**
 * Turns OpenAPI's `nullable` into JSON Schema at every depth: `nullable: true`
 * merges `'null'` into a sibling `type` and is dropped where there is none.
 * JSON Schema has no `nullable`, so a validator or model reading it would
 * refuse `null` where the API accepts it.
 *
 * Only a boolean `nullable` is the keyword; a property *named* `nullable`
 * inside `properties` is a schema and is kept.
 */
export const normalizeNullable = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalizeNullable);
  if (!isPlainObject(value)) return value;

  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (key === 'nullable' && typeof nested === 'boolean') continue;
    result[key] = normalizeNullable(nested);
  }
  if (value.nullable === true) mergeNullIntoType(result);
  return result;
};
