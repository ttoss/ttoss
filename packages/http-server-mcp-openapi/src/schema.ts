import type { OpenApiSpec } from './types';

type ResolvedSchema = {
  type?: string;
  required?: string[];
  properties?: Record<string, unknown>;
  oneOf?: Array<Record<string, unknown>>;
  anyOf?: Array<Record<string, unknown>>;
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

const dereferenceValue = (args: {
  value: unknown;
  spec: OpenApiSpec;
  seenRefs: Set<string>;
}): unknown => {
  const { value, spec, seenRefs } = args;

  if (Array.isArray(value)) {
    return value.map((item) => {
      return dereferenceValue({ value: item, spec, seenRefs });
    });
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;

    if (typeof obj.$ref === 'string') {
      const refName = obj.$ref.replace('#/components/schemas/', '');
      // Guard against circular $refs: if already resolving this ref, stop
      // recursing and return an empty schema rather than looping forever.
      if (seenRefs.has(refName)) return {};
      const resolved = spec.components?.schemas?.[refName];
      // A ref with no target in this document — most often one pointing into
      // another file, e.g. `./tools.yaml#/components/schemas/X`. Resolve it the
      // same way as a circular ref: an empty schema, which accepts any value.
      // Returning `undefined` instead would put an undefined value inside
      // `properties`, and while JSON serialisation silently drops it, the
      // in-memory schema is what a JSON Schema validator compiles — and it
      // throws on `Object.keys(undefined)` while walking `properties`.
      if (resolved === undefined) return {};
      return dereferenceValue({
        value: resolved,
        spec,
        seenRefs: new Set(seenRefs).add(refName),
      });
    }

    const result: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(obj)) {
      result[key] = dereferenceValue({ value: entryValue, spec, seenRefs });
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
 */
export const dereferenceSchema = (
  schema: Record<string, unknown> | undefined,
  spec: OpenApiSpec
): Record<string, unknown> | undefined => {
  if (!schema) return schema;
  return dereferenceValue({
    value: schema,
    spec,
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
  spec: OpenApiSpec
): ResolvedSchema => {
  if (!schema) return {};
  if (typeof schema.$ref === 'string') {
    const refName = schema.$ref.replace('#/components/schemas/', '');
    const resolved = spec.components?.schemas?.[refName];
    return resolveSchema(resolved as Record<string, unknown> | undefined, spec);
  }

  const alternatives = getAlternativeSchemas(schema);

  if (alternatives) {
    return mergeResolvedSchemas(
      alternatives.map((candidate) => {
        return resolveSchema(candidate, spec);
      })
    );
  }

  return schema;
};

/** Follows a parameter `$ref` into `components.parameters`, if present. */
export const resolveParameter = (
  param: Record<string, unknown> | undefined,
  spec: OpenApiSpec
): {
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
} => {
  if (!param) return {};
  if (typeof param.$ref === 'string') {
    const refName = param.$ref.replace('#/components/parameters/', '');
    const resolved = spec.components?.parameters?.[refName];
    return resolved || {};
  }
  return param;
};

/** Builds a function that substitutes path params into the path template. */
export const buildPathFn = (
  pathTemplate: string,
  pathParams: Array<{ name: string; camelName: string }>
): ((args: Record<string, unknown>) => string) => {
  return (args: Record<string, unknown>) => {
    let result = pathTemplate;
    for (const { name, camelName } of pathParams) {
      const value = args[camelName];
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
  camelName: string;
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

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
      const value = args[param.camelName];
      if (value === undefined || value === null) continue;
      appendQueryValue({ search, param, value });
    }
    const qs = search.toString();
    return qs ? `?${qs}` : '';
  };
};

/**
 * Builds a function that maps camelCase args back to a snake_case request
 * body, skipping `undefined` args. Returns `undefined` when the op has no body.
 */
export const buildBodyFn = (
  bodyProps: Array<{ snakeName: string; camelName: string }>
): ((args: Record<string, unknown>) => Record<string, unknown>) | undefined => {
  if (bodyProps.length === 0) return undefined;

  return (args: Record<string, unknown>) => {
    const body: Record<string, unknown> = {};
    for (const { snakeName, camelName } of bodyProps) {
      if (args[camelName] !== undefined) {
        body[snakeName] = args[camelName];
      }
    }
    return body;
  };
};
