import type { JsonObjectSchema } from '@ttoss/http-server-mcp';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// OpenAPI 3.0 keywords JSON Schema does not have. A validator ignores them and
// a model may read them as meaningful, so they do not reach a tool.
const OPENAPI_ONLY_KEYWORDS = new Set([
  'discriminator',
  'example',
  'externalDocs',
  'xml',
]);

// Keywords whose value is a map of schemas, a single schema, or a list of
// schemas. Everything else (`enum`, `default`, `const`…) is data and is copied
// untouched, so a property *named* `example` or an enum value shaped like a
// schema is never mistaken for one.
const SCHEMA_MAPS = new Set([
  '$defs',
  'definitions',
  'dependentSchemas',
  'patternProperties',
  'properties',
]);

const SCHEMA_VALUES = new Set([
  'additionalProperties',
  'contains',
  'else',
  'if',
  'items',
  'not',
  'propertyNames',
  'then',
  'unevaluatedItems',
  'unevaluatedProperties',
]);

const SCHEMA_LISTS = new Set(['anyOf', 'oneOf', 'prefixItems']);

/**
 * OpenAPI 3.0's `nullable: true` in JSON Schema: `'null'` joins the `type`,
 * and `null` joins an `enum`, which would otherwise still refuse it.
 */
const withNull = (schema: Record<string, unknown>): Record<string, unknown> => {
  const result = { ...schema };

  if (typeof result.type === 'string') {
    result.type = [result.type, 'null'];
  } else if (Array.isArray(result.type) && !result.type.includes('null')) {
    result.type = [...result.type, 'null'];
  }

  if (Array.isArray(result.enum) && !result.enum.includes(null)) {
    result.enum = [...result.enum, null];
  }

  return result;
};

/**
 * Merges an `allOf` into one schema, the shape a tool argument needs.
 *
 * Members that declare `properties` are an object composition — a write body
 * that is a patch plus two fields — and merge their properties and `required`.
 * Otherwise the `allOf` only wraps a referenced scalar so it can carry its own
 * `description` (the one way OpenAPI 3.0 allows beside a `$ref`), and the
 * members are merged as they are. Sibling keys win in both, because the
 * wrapper exists to say something the referenced schema does not.
 */
const mergeAllOf = (args: {
  members: Record<string, unknown>[];
  siblings: Record<string, unknown>;
}): Record<string, unknown> => {
  const { members, siblings } = args;

  const composesObjects = members.some((member) => {
    return member.properties !== undefined;
  });

  if (!composesObjects) {
    return Object.assign({}, ...members, siblings);
  }

  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const member of members) {
    Object.assign(properties, member.properties);
    if (Array.isArray(member.required)) {
      required.push(...(member.required as string[]));
    }
  }

  return {
    ...siblings,
    type: 'object',
    properties,
    ...(required.length > 0 ? { required: [...new Set(required)] } : {}),
  };
};

// The recursion arrives as `next` rather than by name, so this and
// `toToolSchema` are not mutually recursive and read in order.
const normalizeChildren = (args: {
  schema: Record<string, unknown>;
  next: (child: unknown) => unknown;
}): Record<string, unknown> => {
  const { schema, next } = args;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(schema)) {
    if (OPENAPI_ONLY_KEYWORDS.has(key) || key.startsWith('x-')) {
      continue;
    }

    if (SCHEMA_MAPS.has(key) && isRecord(value)) {
      result[key] = Object.fromEntries(
        Object.entries(value).map(([name, child]) => {
          return [name, next(child)];
        })
      );
    } else if (SCHEMA_VALUES.has(key) && isRecord(value)) {
      result[key] = next(value);
    } else if (SCHEMA_LISTS.has(key) && Array.isArray(value)) {
      result[key] = value.map(next);
    } else {
      result[key] = value;
    }
  }

  return result;
};

/**
 * Turns an already-dereferenced OpenAPI schema into the JSON Schema a tool
 * argument carries, keeping every constraint it declares — `enum`, `format`,
 * `pattern`, `minimum`, `default`, nested `properties` and `required`,
 * `oneOf` — and changing only what JSON Schema cannot express: `allOf` is
 * merged, `nullable` becomes a `'null'` type, and OpenAPI-only keywords and
 * `x-` extensions are dropped. Descriptions are kept verbatim.
 */
export const toToolSchema = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return value;
  }

  const { allOf, nullable, ...rest } = value;

  const own = normalizeChildren({ schema: rest, next: toToolSchema });

  const merged = Array.isArray(allOf)
    ? mergeAllOf({
        members: allOf.filter(isRecord).map((member) => {
          return toToolSchema(member) as Record<string, unknown>;
        }),
        siblings: own,
      })
    : own;

  return nullable === true ? withNull(merged) : merged;
};

type FullParam = {
  argName: string;
  required?: boolean;
  description?: string;
  schema?: unknown;
  serverManaged?: boolean;
};

type FullBodyProp = {
  argName: string;
  required: boolean;
  schema: Record<string, unknown>;
};

/** A path or query parameter's schema, with the parameter's own description. */
const paramProperty = (param: FullParam): unknown => {
  const schema = (toToolSchema(param.schema) ?? {}) as Record<string, unknown>;

  return {
    ...schema,
    ...(param.description ? { description: param.description } : {}),
  };
};

/**
 * The `inputSchema` of a tool under `schemaDetail: 'full'`: every parameter
 * and body property with its whole schema. `properties` is always present,
 * even when empty, because some clients refuse an object schema without it.
 */
export const buildFullInputSchema = (args: {
  pathParams: FullParam[];
  queryParams: FullParam[];
  bodyProps: FullBodyProp[];
}): JsonObjectSchema => {
  const params = [...args.pathParams, ...args.queryParams].filter((param) => {
    return !param.serverManaged;
  });

  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const param of params) {
    properties[param.argName] = paramProperty(param);
    if (param.required) required.push(param.argName);
  }

  for (const prop of args.bodyProps) {
    properties[prop.argName] = toToolSchema(prop.schema);
    if (prop.required) required.push(prop.argName);
  }

  return {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required: [...new Set(required)] } : {}),
  } as JsonObjectSchema;
};
