import type { OpenApiSchema, OpenApiSpec } from './types';

/**
 * Some servers snake_case component keys while leaving `$ref` strings on the
 * original name, so an absent exact key falls back to the snake_cased one.
 */
const lookupRefKey = (obj: Record<string, unknown>, part: string): string => {
  if (part in obj) {
    return part;
  }
  const snake = part.replace(/[A-Z]/g, (char) => {
    return `_${char.toLowerCase()}`;
  });
  return snake in obj ? snake : part;
};

const resolveRef = (
  ref: string,
  spec: OpenApiSpec
): OpenApiSchema | undefined => {
  // A merged spec names the same place with `./file.yaml#/…` and `#/…`.
  const parts = ref.replace(/^[^#]*#\//, '').split('/');
  let current: unknown = spec;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    const obj = current as Record<string, unknown>;
    current = obj[lookupRefKey(obj, part)];
  }
  return (current as OpenApiSchema | undefined) ?? undefined;
};

const MAX_DEPTH = 16;

type ResolveArgs = {
  schema: OpenApiSchema | undefined;
  spec: OpenApiSpec;
  depth?: number;
};

/**
 * OpenAPI 3.1 allows keywords next to `$ref` (`default`, `description`,
 * `title`…); they refine the referenced schema rather than being dropped.
 */
type Resolve = (args: ResolveArgs) => OpenApiSchema | undefined;

const resolveRefSchema = ({
  schema,
  spec,
  depth,
  resolve,
}: {
  schema: OpenApiSchema & { $ref: string };
  spec: OpenApiSpec;
  depth: number;
  resolve: Resolve;
}): OpenApiSchema | undefined => {
  const resolved = resolve({
    schema: resolveRef(schema.$ref, spec),
    spec,
    depth: depth + 1,
  });
  const { $ref: _ref, ...siblings } = schema;
  return resolved && Object.keys(siblings).length > 0
    ? { ...resolved, ...siblings }
    : resolved;
};

const mergeAllOf = ({
  schema,
  spec,
  depth,
  resolve,
}: {
  schema: OpenApiSchema & { allOf: OpenApiSchema[] };
  spec: OpenApiSpec;
  depth: number;
  resolve: Resolve;
}): OpenApiSchema => {
  const properties: Record<string, OpenApiSchema> = {};
  const required: string[] = [];
  for (const member of schema.allOf) {
    const resolved = resolve({ schema: member, spec, depth: depth + 1 });
    for (const [key, value] of Object.entries(resolved?.properties ?? {})) {
      properties[key] = { ...properties[key], ...value };
    }
    required.push(...(resolved?.required ?? []));
  }
  const { allOf: _allOf, ...rest } = schema;
  return { ...rest, type: 'object', properties, required };
};

/**
 * Resolves `$ref` and flattens `allOf` into one object schema, merging
 * properties key by key so `{ allOf: [Page, { properties: { data: { items } } }] }`
 * yields a `data` that carries both `type: array` and its item schema.
 */
export const resolveSchema = ({
  schema,
  spec,
  depth = 0,
}: ResolveArgs): OpenApiSchema | undefined => {
  if (!schema || depth > MAX_DEPTH) {
    return undefined;
  }
  if (schema.$ref) {
    return resolveRefSchema({
      schema: schema as OpenApiSchema & { $ref: string },
      spec,
      depth,
      resolve: resolveSchema,
    });
  }
  if (schema.allOf) {
    return mergeAllOf({
      schema: schema as OpenApiSchema & { allOf: OpenApiSchema[] },
      spec,
      depth,
      resolve: resolveSchema,
    });
  }
  return schema;
};

/**
 * Resolves each property of an object schema one level deep, so a field
 * declared as `{ $ref: '#/components/schemas/Status' }` exposes its `enum`,
 * `type` and `format` to column and cell logic.
 */
export const withResolvedProperties = ({
  schema,
  spec,
}: {
  schema: OpenApiSchema | undefined;
  spec: OpenApiSpec;
}): OpenApiSchema | undefined => {
  if (!schema?.properties) {
    return schema;
  }
  const properties: Record<string, OpenApiSchema> = {};
  for (const [key, prop] of Object.entries(schema.properties)) {
    properties[key] = resolveSchema({ schema: prop, spec }) ?? prop;
  }
  return { ...schema, properties };
};
