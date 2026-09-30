import { snakeToCamel, type ToArgName } from './parameters';
import { dereferenceSchema, resolveSchema } from './schema';
import {
  readServerManaged,
  type ServerManagedExtension,
  typedPin,
} from './serverManaged';
import type { OpenApiDocuments, OpenApiSpec, RequestBodySpec } from './types';

const resolveBodySchema = (args: {
  requestBody?: RequestBodySpec;
  spec: OpenApiSpec;
  documents?: OpenApiDocuments;
}) => {
  const rawBodySchema = args.requestBody?.content?.['application/json']?.schema;
  const dereferencedBodySchema = dereferenceSchema(
    rawBodySchema,
    args.spec,
    args.documents
  );
  return resolveSchema(dereferencedBodySchema, args.spec, args.documents);
};

/**
 * snake_case names of every top-level property an operation's request schema
 * declares, including server-managed ones.
 */
export const extractAcceptedBodyFields = (args: {
  requestBody?: RequestBodySpec;
  spec: OpenApiSpec;
  documents?: OpenApiDocuments;
}): string[] => {
  const bodySchema = resolveBodySchema(args);
  return Object.keys(bodySchema?.properties ?? {});
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * Folds a single-entry `allOf` into the property that wraps it. OpenAPI
 * declares `allOf: [{ $ref }]` so a property can carry its own `description`
 * next to a referenced schema; without folding, the referenced `type`,
 * `nullable` and `items` would be lost. Keys on the wrapper win over the
 * referenced schema's. Multi-entry `allOf` is left intact.
 */
const flattenSingleAllOf = (
  schema: Record<string, unknown>
): Record<string, unknown> => {
  const { allOf, ...rest } = schema;
  if (!Array.isArray(allOf) || allOf.length !== 1) return schema;
  const [entry] = allOf;
  if (!isPlainObject(entry)) return rest;
  return { ...flattenSingleAllOf(entry), ...rest };
};

export const extractBodyProps = (args: {
  requestBody?: RequestBodySpec;
  spec: OpenApiSpec;
  serverManagedExtension: ServerManagedExtension;
  documents?: OpenApiDocuments;
  /** Maps a spec name to its tool argument name. @default snakeToCamel */
  toArgName?: ToArgName;
}): Array<{
  snakeName: string;
  argName: string;
  description: string;
  required: boolean;
  type?: string;
  items?: unknown;
  nullable: boolean;
  oneOf?: unknown[];
  anyOf?: unknown[];
  allOf?: unknown[];
  /** The property's whole schema, with every `$ref` inlined. */
  schema: Record<string, unknown>;
}> => {
  const toArgName = args.toArgName ?? snakeToCamel;
  const bodySchema = resolveBodySchema(args);
  if (!bodySchema?.properties) return [];
  const entries = Object.entries(bodySchema.properties).filter(
    ([, value]: [string, unknown]) => {
      const val = value as Record<string, unknown>;
      return !readServerManaged({
        node: val,
        extension: args.serverManagedExtension,
      }).managed;
    }
  );
  return entries.map(([key, value]: [string, unknown]) => {
    const val = flattenSingleAllOf(value as Record<string, unknown>) as {
      description?: unknown;
      type?: unknown;
      items?: unknown;
      nullable?: unknown;
      oneOf?: unknown;
      anyOf?: unknown;
      allOf?: unknown;
    };
    return {
      snakeName: key,
      argName: toArgName(key),
      description: typeof val.description === 'string' ? val.description : '',
      required: (bodySchema.required || []).includes(key),
      type: typeof val.type === 'string' ? val.type : undefined,
      items: val.items,
      nullable: val.nullable === true,
      oneOf: Array.isArray(val.oneOf) ? val.oneOf : undefined,
      anyOf: Array.isArray(val.anyOf) ? val.anyOf : undefined,
      allOf: Array.isArray(val.allOf) ? val.allOf : undefined,
      schema: value as Record<string, unknown>,
    };
  });
};

/**
 * The value each server-managed body property pins, typed by its schema and
 * keyed by its spec name. A property whose extension is not a string pins
 * nothing: it is only hidden, for the consumer to fill.
 */
export const extractPinnedBody = (args: {
  requestBody?: RequestBodySpec;
  spec: OpenApiSpec;
  serverManagedExtension: ServerManagedExtension;
  documents?: OpenApiDocuments;
  operationId: string;
}): Record<string, string | number | boolean> => {
  const bodySchema = resolveBodySchema(args);
  const pinned: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(bodySchema?.properties ?? {})) {
    const node = value as Record<string, unknown>;
    const { value: pin } = readServerManaged({
      node,
      extension: args.serverManagedExtension,
    });
    if (pin === undefined) continue;
    pinned[key] = typedPin({
      value: pin,
      type: flattenSingleAllOf(node).type,
      where: `${args.operationId} body property '${key}'`,
    });
  }
  return pinned;
};
