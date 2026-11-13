import { getResponseSchema } from './operations';
import { withResolvedProperties } from './schema';
import { humanizeKey, isSensitiveField } from './table';
import type {
  HttpMethod,
  JsonObject,
  OpenApiSchema,
  OpenApiSpec,
  ResolvedOperation,
} from './types';
import { HTTP_METHODS } from './types';

const isJsonObject = (value: unknown): value is JsonObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const WRAPPER_KEYS = ['data', 'item', 'result'];

/**
 * The record a detail GET returns: the body itself, or its `data`/`item`/
 * `result` property when the API wraps single records.
 */
export const extractRecord = (data: unknown): JsonObject | undefined => {
  if (!isJsonObject(data)) {
    return undefined;
  }
  const keys = Object.keys(data);
  for (const key of WRAPPER_KEYS) {
    if (isJsonObject(data[key]) && keys.length <= 2) {
      return data[key];
    }
  }
  return data;
};

/**
 * The record schema of a detail operation, unwrapping the same wrappers as
 * `extractRecord`.
 */
export const getRecordSchema = ({
  operation,
  spec,
}: {
  operation: ResolvedOperation;
  spec: OpenApiSpec;
}): OpenApiSchema | undefined => {
  const schema = withResolvedProperties({
    schema: getResponseSchema({ operation, spec }),
    spec,
  });
  const properties = schema?.properties ?? {};
  for (const key of WRAPPER_KEYS) {
    const inner = properties[key];
    if (inner?.type === 'object' && Object.keys(properties).length <= 2) {
      return withResolvedProperties({ schema: inner, spec });
    }
  }
  return schema;
};

export type DetailField = {
  key: string;
  label: string;
  schema?: OpenApiSchema;
  sensitive: boolean;
};

/**
 * The fields a detail view shows: the schema's properties in declaration
 * order (skipping `writeOnly` ones, which the API never returns), followed by
 * any extra key present on the record. Pass `keys` to choose and order them.
 */
export const getDetailFields = ({
  schema,
  record,
  keys,
}: {
  schema?: OpenApiSchema;
  record?: JsonObject;
  keys?: string[];
}): DetailField[] => {
  const properties = schema?.properties ?? {};
  const ordered =
    keys ??
    Array.from(
      new Set([
        ...Object.keys(properties).filter((key) => {
          return !properties[key].writeOnly;
        }),
        ...Object.keys(record ?? {}),
      ])
    );
  return ordered.map((key) => {
    const fieldSchema = properties[key];
    return {
      key,
      label: fieldSchema?.title ?? humanizeKey(key),
      schema: fieldSchema,
      sensitive: isSensitiveField({ key, schema: fieldSchema }),
    };
  });
};

/**
 * A one-line label for a record: its `name`, `title`, `label` or `email`,
 * falling back to its `id`.
 */
export const recordLabel = (record: JsonObject): string | undefined => {
  for (const key of ['name', 'title', 'label', 'email', 'id']) {
    const value = record[key];
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
  }
  return undefined;
};

/**
 * Another operation on the same path, e.g. the GET that loads the record a
 * PUT edits.
 */
export const findSiblingOperation = ({
  spec,
  operation,
  method,
}: {
  spec: OpenApiSpec;
  operation: ResolvedOperation;
  method: HttpMethod;
}): ResolvedOperation | undefined => {
  const pathItem = spec.paths?.[operation.pathTemplate];
  const sibling = pathItem?.[method] as
    (ResolvedOperation['operation'] & { operation_id?: string }) | undefined;
  if (!sibling || !HTTP_METHODS.includes(method)) {
    return undefined;
  }
  return {
    method,
    pathTemplate: operation.pathTemplate,
    operation: {
      ...sibling,
      operationId: sibling.operationId ?? sibling.operation_id ?? '',
      parameters: [
        ...(pathItem?.parameters ?? []),
        ...(sibling.parameters ?? []),
      ],
    },
  };
};
