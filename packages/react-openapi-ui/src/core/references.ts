import { recordLabel } from './detail';
import type { ApiResource } from './resources';
import type {
  JsonObject,
  JsonValue,
  OpenApiSchema,
  OperationParams,
} from './types';

// ─── References between resources (`x-ref`) ──────────────────────────────────

/** Extensions that name the resource a field references, in priority order. */
const REF_EXTENSIONS = ['x-ref', 'x-soat-ref'] as const;

const ownRefName = (schema?: OpenApiSchema): string | undefined => {
  for (const extension of REF_EXTENSIONS) {
    const ref = schema?.[extension];
    if (typeof ref === 'string' && ref) {
      return ref;
    }
  }
  return undefined;
};

/**
 * The resource a field references, as named by its `x-ref` extension
 * (e.g. `{ type: 'string', 'x-ref': 'clients' }`) or `x-soat-ref`, or
 * undefined. An array of ids may carry it on itself or on its `items`.
 */
export const getRefName = (schema?: OpenApiSchema): string | undefined => {
  return (
    ownRefName(schema) ??
    (schema?.type === 'array' ? ownRefName(schema.items) : undefined)
  );
};

/**
 * The resource an `x-ref` names, matched against its path segment, key or
 * tag (case-insensitive).
 */
export const findResourceByRef = ({
  resources,
  ref,
}: {
  resources: ApiResource[];
  ref: string;
}): ApiResource | undefined => {
  const name = ref.toLowerCase();
  return resources.find((resource) => {
    return [resource.segment, resource.key, resource.tag].some((candidate) => {
      return candidate?.toLowerCase() === name;
    });
  });
};

/**
 * Whether the resource's list can be opened with these params: it has a list
 * operation and every scope param (a parent id) has a value.
 */
export const isListable = ({
  resource,
  params = {},
}: {
  resource: ApiResource;
  params?: OperationParams;
}): boolean => {
  return (
    !!resource.list &&
    resource.scopeParams.every((name) => {
      const value = params[name];
      return value !== undefined && value !== null && value !== '';
    })
  );
};

/** The id of a record: its value for the resource's id param, else its `id`. */
export const getRecordId = ({
  resource,
  record,
}: {
  resource: ApiResource;
  record: JsonObject;
}): string | undefined => {
  const value: JsonValue | undefined =
    (resource.idParam ? record[resource.idParam] : undefined) ?? record.id;
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : undefined;
};

/** One option of a reference picker: the record id and a readable label. */
export const toRefOption = ({
  resource,
  record,
}: {
  resource: ApiResource;
  record: JsonObject;
}): { value: string; label: string } | undefined => {
  const value = getRecordId({ resource, record });
  if (value === undefined) {
    return undefined;
  }
  const label = recordLabel(record);
  return { value, label: label && label !== value ? label : value };
};
