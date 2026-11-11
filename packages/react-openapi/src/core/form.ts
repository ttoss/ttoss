import { resolveSchema, withResolvedProperties } from './schema';
import { humanizeKey, isSensitiveKey } from './table';
import type { OpenApiSchema, OpenApiSpec, ResolvedOperation } from './types';

// ─── Request body ────────────────────────────────────────────────────────────

export type RequestBody = {
  schema: OpenApiSchema;
  contentType: 'json' | 'multipart';
};

type BodyContent = Record<string, { schema?: OpenApiSchema }>;

const findJsonSchema = (content: BodyContent): OpenApiSchema | undefined => {
  const entry =
    content['application/json'] ??
    Object.entries(content).find(([type]) => {
      return type.includes('json');
    })?.[1];
  return entry?.schema;
};

/** Resolves the item schema of array properties (e.g. an enum by `$ref`). */
const resolveArrayItems = ({
  schema,
  spec,
}: {
  schema: OpenApiSchema;
  spec: OpenApiSpec;
}): Record<string, OpenApiSchema> => {
  const properties: Record<string, OpenApiSchema> = {};
  for (const [key, prop] of Object.entries(schema.properties ?? {})) {
    properties[key] =
      prop.type === 'array' && prop.items
        ? { ...prop, items: resolveSchema({ schema: prop.items, spec }) }
        : prop;
  }
  return properties;
};

/**
 * The resolved request body schema of an operation, with its properties (and
 * array item schemas) resolved, and whether it is sent as JSON or multipart.
 */
export const getRequestBody = ({
  operation,
  spec,
}: {
  operation: ResolvedOperation;
  spec: OpenApiSpec;
}): RequestBody | undefined => {
  const content = operation.operation.requestBody?.content ?? {};
  const json = findJsonSchema(content);
  const raw = json ?? content['multipart/form-data']?.schema;
  const schema = withResolvedProperties({
    schema: resolveSchema({ schema: raw, spec }),
    spec,
  });
  if (!schema) {
    return undefined;
  }
  return {
    schema: { ...schema, properties: resolveArrayItems({ schema, spec }) },
    contentType: json ? 'json' : 'multipart',
  };
};

// ─── Fields ──────────────────────────────────────────────────────────────────

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'url'
  | 'password'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'multiEnum'
  | 'date'
  | 'datetime'
  | 'file'
  | 'json';

const LONG_TEXT_KEYS =
  /^(description|content|body|notes?|message|prompt|text|instructions)$/i;

const TYPE_KINDS: Partial<Record<string, FieldKind>> = {
  object: 'json',
  array: 'json',
  boolean: 'boolean',
  integer: 'integer',
  number: 'number',
};

const FORMAT_KINDS: Partial<Record<string, FieldKind>> = {
  binary: 'file',
  date: 'date',
  'date-time': 'datetime',
  email: 'email',
  uri: 'url',
  url: 'url',
  password: 'password',
  textarea: 'textarea',
};

/** A select for an enum, checkboxes for an array of enum values. */
const enumKind = (schema: OpenApiSchema): FieldKind | undefined => {
  if (schema.enum && schema.enum.length > 0) {
    return 'enum';
  }
  return schema.type === 'array' && schema.items?.enum
    ? 'multiEnum'
    : undefined;
};

/** A kind decided by the field name alone, for schemas that say nothing. */
const nameKind = ({
  name,
  schema,
}: {
  name: string;
  schema: OpenApiSchema;
}): FieldKind => {
  if (isSensitiveKey(name)) {
    return 'password';
  }
  if ((schema.maxLength ?? 0) > 255 || LONG_TEXT_KEYS.test(name)) {
    return 'textarea';
  }
  return 'text';
};

/**
 * The input widget a field needs, decided from its schema: an `x-widget`
 * hint, then enum, type and format, then the field name.
 */
export const getFieldKind = ({
  name,
  schema,
}: {
  name: string;
  schema: OpenApiSchema;
}): FieldKind => {
  if (schema['x-widget'] === 'textarea') {
    return 'textarea';
  }
  const choice = enumKind(schema);
  if (choice) {
    return choice;
  }
  const byType = schema.type ? TYPE_KINDS[schema.type] : undefined;
  const byFormat = schema.format ? FORMAT_KINDS[schema.format] : undefined;
  return byType ?? byFormat ?? nameKind({ name, schema });
};

export type FormField = {
  name: string;
  label: string;
  description?: string;
  schema: OpenApiSchema;
  required: boolean;
  kind: FieldKind;
};

/**
 * The editable fields of a request body, in declaration order. `readOnly`
 * fields are left out: the server sets them. Pass `names` to choose and order
 * the fields.
 */
export const getFormFields = ({
  schema,
  names,
}: {
  schema: OpenApiSchema;
  names?: string[];
}): FormField[] => {
  const properties = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  const keys =
    names ??
    Object.keys(properties).filter((key) => {
      return !properties[key].readOnly;
    });
  return keys
    .filter((key) => {
      return key in properties;
    })
    .map((name) => {
      const fieldSchema = properties[name];
      return {
        name,
        label: fieldSchema.title ?? humanizeKey(name),
        description: fieldSchema.description,
        schema: fieldSchema,
        required: required.has(name),
        kind: getFieldKind({ name, schema: fieldSchema }),
      };
    });
};
