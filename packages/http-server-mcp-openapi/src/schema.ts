import type { OpenApiDocuments, OpenApiSpec } from './types';

type ResolvedSchema = {
  type?: string;
  required?: string[];
  properties?: Record<string, unknown>;
  oneOf?: Array<Record<string, unknown>>;
  anyOf?: Array<Record<string, unknown>>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const getAlternativeSchemas = (
  schema: Record<string, unknown>
): Array<Record<string, unknown>> | undefined => {
  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    return schema.oneOf as Array<Record<string, unknown>>;
  }

  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    return schema.anyOf as Array<Record<string, unknown>>;
  }

  return undefined;
};

const mergeResolvedSchemas = (
  resolvedAlternatives: ResolvedSchema[]
): ResolvedSchema => {
  const mergedProperties = Object.assign(
    {},
    ...resolvedAlternatives.map((candidate) => {
      return candidate.properties ?? {};
    })
  );

  const requiredIntersection = resolvedAlternatives.reduce<
    string[] | undefined
  >((current, candidate) => {
    const required = candidate.required ?? [];

    if (current === undefined) {
      return [...required];
    }

    return current.filter((field) => {
      return required.includes(field);
    });
  }, undefined);

  return {
    type: 'object',
    properties:
      Object.keys(mergedProperties).length > 0 ? mergedProperties : undefined,
    required:
      requiredIntersection && requiredIntersection.length > 0
        ? requiredIntersection
        : undefined,
  };
};

/** Where a `$ref` is resolved: the document it appears in, plus its siblings. */
type RefScope = {
  spec: OpenApiSpec;
  documents?: OpenApiDocuments;
};

const stripDotSlash = (file: string): string => {
  return file.replace(/^\.\//, '');
};

const findDocument = (args: {
  file: string;
  documents?: OpenApiDocuments;
}): OpenApiSpec | undefined => {
  if (!args.documents) return undefined;
  const wanted = stripDotSlash(args.file);
  for (const [key, document] of Object.entries(args.documents)) {
    if (stripDotSlash(key) === wanted) return document;
  }
  return undefined;
};

/** Follows an RFC 6901 JSON pointer (`/components/schemas/Tag`) into a value. */
const followPointer = (args: { root: unknown; pointer: string }): unknown => {
  const tokens = args.pointer.split('/').slice(1);
  let current = args.root;
  for (const rawToken of tokens) {
    if (!isRecord(current) && !Array.isArray(current)) return undefined;
    const token = decodeURIComponent(rawToken)
      .replace(/~1/g, '/')
      .replace(/~0/g, '~');
    current = (current as Record<string, unknown>)[token];
  }
  return current;
};

/** Stable identity for each document, so cycle keys never collide across files. */
const documentIds = new WeakMap<object, number>();
let nextDocumentId = 0;

const documentId = (spec: OpenApiSpec): number => {
  const known = documentIds.get(spec);
  if (known !== undefined) return known;
  nextDocumentId += 1;
  documentIds.set(spec, nextDocumentId);
  return nextDocumentId;
};

/**
 * Resolves a `$ref` to its target and the document the target lives in (the
 * scope its own nested refs resolve against). A ref without a file part
 * (`#/components/schemas/X`) points into the current document; one with a
 * file part (`./tags.yaml#/components/schemas/Tag`) points into the matching
 * entry of `documents`. Returns `undefined` when the target does not exist.
 */
const resolveRef = (args: {
  ref: string;
  scope: RefScope;
}): { value: unknown; scope: RefScope; key: string } | undefined => {
  const hashIndex = args.ref.indexOf('#');
  const file = hashIndex === -1 ? args.ref : args.ref.slice(0, hashIndex);
  const pointer = hashIndex === -1 ? '' : args.ref.slice(hashIndex + 1);

  const spec =
    file === ''
      ? args.scope.spec
      : findDocument({ file, documents: args.scope.documents });
  if (!spec) return undefined;

  const value = followPointer({ root: spec, pointer });
  if (value === undefined) return undefined;

  return {
    value,
    scope: { spec, documents: args.scope.documents },
    key: `${documentId(spec)}#${pointer}`,
  };
};

const dereferenceValue = (args: {
  value: unknown;
  scope: RefScope;
  seenRefs: Set<string>;
}): unknown => {
  const { value, scope, seenRefs } = args;

  if (Array.isArray(value)) {
    return value.map((item) => {
      return dereferenceValue({ value: item, scope, seenRefs });
    });
  }

  if (isRecord(value)) {
    if (typeof value.$ref === 'string') {
      const target = resolveRef({ ref: value.$ref, scope });
      // A ref with no target — a missing component, or a file absent from
      // `documents` — resolves to an empty schema, which accepts any value.
      // Returning `undefined` instead would put an undefined value inside
      // `properties`, and while JSON serialisation silently drops it, the
      // in-memory schema is what a JSON Schema validator compiles — and it
      // throws on `Object.keys(undefined)` while walking `properties`.
      if (!target) return {};
      // Guard against circular $refs: if already resolving this ref, stop
      // recursing and return an empty schema rather than looping forever.
      if (seenRefs.has(target.key)) return {};
      return dereferenceValue({
        value: target.value,
        scope: target.scope,
        seenRefs: new Set(seenRefs).add(target.key),
      });
    }

    const result: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(value)) {
      result[key] = dereferenceValue({ value: entryValue, scope, seenRefs });
    }
    return result;
  }

  return value;
};

/**
 * Recursively inlines every `$ref` in a schema (including refs nested inside
 * `properties`, `items`, `oneOf`, `anyOf`, etc.), producing a self-contained
 * schema safe to hand to an MCP client or LLM provider as a tool definition —
 * provider tool schemas have no `components` section to resolve refs against.
 *
 * Refs into other files resolve against `documents`; see {@link OpenApiDocuments}.
 */
export const dereferenceSchema = (
  schema: Record<string, unknown> | undefined,
  spec: OpenApiSpec,
  documents?: OpenApiDocuments
): Record<string, unknown> | undefined => {
  if (!schema) return schema;
  return dereferenceValue({
    value: schema,
    scope: { spec, documents },
    seenRefs: new Set(),
  }) as Record<string, unknown>;
};

/**
 * Resolves a schema down to a single object shape: follows a top-level `$ref`
 * and merges `oneOf` / `anyOf` alternatives (union of properties, intersection
 * of `required`) so the caller sees one flat property set.
 */
export const resolveSchema = (
  schema: Record<string, unknown> | undefined,
  spec: OpenApiSpec,
  documents?: OpenApiDocuments
): ResolvedSchema => {
  if (!schema) return {};
  if (typeof schema.$ref === 'string') {
    const target = resolveRef({ ref: schema.$ref, scope: { spec, documents } });
    return resolveSchema(
      target?.value as Record<string, unknown> | undefined,
      target?.scope.spec ?? spec,
      documents
    );
  }

  const alternatives = getAlternativeSchemas(schema);

  if (alternatives) {
    return mergeResolvedSchemas(
      alternatives.map((candidate) => {
        return resolveSchema(candidate, spec, documents);
      })
    );
  }

  return schema;
};

/** A parameter object after its `$ref` (if any) is followed. */
export type ResolvedParameter = {
  name?: string;
  in?: string;
  required?: boolean;
  description?: string;
  style?: string;
  explode?: boolean;
  schema?: {
    type?: string;
    items?: { type?: string };
  };
  [extension: string]: unknown;
};

/**
 * Follows a parameter `$ref` — into `components.parameters`, or into another
 * file through `documents` — if present.
 */
export const resolveParameter = (
  param: Record<string, unknown> | undefined,
  spec: OpenApiSpec,
  documents?: OpenApiDocuments
): ResolvedParameter => {
  if (!param) return {};
  if (typeof param.$ref === 'string') {
    const target = resolveRef({ ref: param.$ref, scope: { spec, documents } });
    return isRecord(target?.value) ? target.value : {};
  }
  return param;
};

/** Builds a function that substitutes path params into the path template. */
export const buildPathFn = (
  pathTemplate: string,
  pathParams: Array<{ name: string; argName: string }>
): ((args: Record<string, unknown>) => string) => {
  return (args: Record<string, unknown>) => {
    let result = pathTemplate;
    for (const { name, argName } of pathParams) {
      const value = args[argName];
      if (value !== undefined) {
        result = result.replace(`{${name}}`, encodeURIComponent(String(value)));
      }
    }
    return result;
  };
};

/** Query parameter with the OpenAPI serialisation rules declared for it. */
export type QueryParamSerialization = {
  name: string;
  argName: string;
  /** OpenAPI `style` (`form`, `deepObject`, `spaceDelimited`, `pipeDelimited`). */
  style?: string;
  /** OpenAPI `explode`. Defaults to `true` for `form`, `false` otherwise. */
  explode?: boolean;
};

const NON_EXPLODED_DELIMITERS: Record<string, string> = {
  form: ',',
  spaceDelimited: ' ',
  pipeDelimited: '|',
};

/**
 * Appends a `deepObject` value as bracketed keys — `filters[documentId][$eq]`.
 * OpenAPI only defines one level, but the APIs that ask for `deepObject`
 * (Strapi, Directus) nest, so nested objects and arrays recurse instead of
 * being stringified into `[object Object]`.
 */
const appendDeepObject = (args: {
  search: URLSearchParams;
  key: string;
  value: unknown;
}): void => {
  if (args.value === undefined || args.value === null) return;

  if (Array.isArray(args.value)) {
    for (const [index, item] of args.value.entries()) {
      appendDeepObject({
        search: args.search,
        key: `${args.key}[${index}]`,
        value: item,
      });
    }
    return;
  }

  if (isRecord(args.value)) {
    for (const [property, propertyValue] of Object.entries(args.value)) {
      appendDeepObject({
        search: args.search,
        key: `${args.key}[${property}]`,
        value: propertyValue,
      });
    }
    return;
  }

  args.search.append(args.key, String(args.value));
};

const appendArrayValue = (args: {
  search: URLSearchParams;
  name: string;
  value: unknown[];
  explode: boolean;
  delimiter: string;
}): void => {
  if (args.explode) {
    for (const item of args.value) {
      args.search.append(args.name, String(item));
    }
    return;
  }
  args.search.append(args.name, args.value.map(String).join(args.delimiter));
};

const appendObjectValue = (args: {
  search: URLSearchParams;
  name: string;
  value: Record<string, unknown>;
  explode: boolean;
  delimiter: string;
}): void => {
  const entries = Object.entries(args.value).filter(([, entryValue]) => {
    return entryValue !== undefined && entryValue !== null;
  });

  if (args.explode) {
    for (const [property, entryValue] of entries) {
      args.search.append(property, String(entryValue));
    }
    return;
  }

  args.search.append(
    args.name,
    entries
      .flatMap(([property, entryValue]) => {
        return [property, String(entryValue)];
      })
      .join(args.delimiter)
  );
};

const appendQueryValue = (args: {
  search: URLSearchParams;
  param: QueryParamSerialization;
  value: unknown;
}): void => {
  const style = args.param.style ?? 'form';

  if (style === 'deepObject') {
    appendDeepObject({
      search: args.search,
      key: args.param.name,
      value: args.value,
    });
    return;
  }

  const serialization = {
    search: args.search,
    name: args.param.name,
    // Per OpenAPI, `explode` defaults to true only for `form`.
    explode: args.param.explode ?? style === 'form',
    delimiter: NON_EXPLODED_DELIMITERS[style] ?? ',',
  };

  if (Array.isArray(args.value)) {
    appendArrayValue({ ...serialization, value: args.value });
    return;
  }

  if (isRecord(args.value)) {
    appendObjectValue({ ...serialization, value: args.value });
    return;
  }

  args.search.append(args.param.name, String(args.value));
};

/**
 * Builds a function that serialises query params into a query string
 * (including the leading `?`), honouring each param's OpenAPI `style` and
 * `explode`. Returns `undefined` when the op has no query params.
 */
export const buildQueryFn = (
  queryParams: QueryParamSerialization[]
): ((args: Record<string, unknown>) => string) | undefined => {
  if (queryParams.length === 0) return undefined;

  return (args: Record<string, unknown>) => {
    const search = new URLSearchParams();
    for (const param of queryParams) {
      const value = args[param.argName];
      if (value === undefined || value === null) continue;
      appendQueryValue({ search, param, value });
    }
    const qs = search.toString();
    return qs ? `?${qs}` : '';
  };
};

/**
 * Builds a function that maps tool args back to a request body keyed by the
 * spec's property names, skipping `undefined` args. Returns `undefined` when the op has no body.
 */
export const buildBodyFn = (
  bodyProps: Array<{ snakeName: string; argName: string }>
): ((args: Record<string, unknown>) => Record<string, unknown>) | undefined => {
  if (bodyProps.length === 0) return undefined;

  return (args: Record<string, unknown>) => {
    const body: Record<string, unknown> = {};
    for (const { snakeName, argName } of bodyProps) {
      if (args[argName] !== undefined) {
        body[snakeName] = args[argName];
      }
    }
    return body;
  };
};
