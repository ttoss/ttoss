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

/**
 * Builds a function that serialises query params into a query string
 * (including the leading `?`). Returns `undefined` when the op has no query
 * params. Array values are appended once per element.
 */
export const buildQueryFn = (
  queryParams: Array<{ name: string; camelName: string }>
): ((args: Record<string, unknown>) => string) | undefined => {
  if (queryParams.length === 0) return undefined;

  return (args: Record<string, unknown>) => {
    const search = new URLSearchParams();
    for (const { name, camelName } of queryParams) {
      const value = args[camelName];
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          search.append(name, String(item));
        }
      } else {
        search.append(name, String(value));
      }
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
