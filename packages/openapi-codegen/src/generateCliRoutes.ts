import fs from 'node:fs';
import path from 'node:path';

import { load } from 'js-yaml';

import type {
  CliOpenApiSpec,
  OpenApiOperation,
  OpenApiParameterFull,
  OpenApiPathItem,
  OpenApiRequestBodyProperty,
  OpenApiRequestBodySchema,
} from './openApiOperationTypes';

/** Converts a camelCase `operationId` to a kebab-case CLI command name. */
export const operationIdToKebabCommand = (operationId: string): string => {
  return operationId
    .replace(/([A-Z])/g, (letter) => {
      return `-${letter.toLowerCase()}`;
    })
    .replace(/^-/, '');
};

/** Derives a PascalCase SDK service class name from a tag string (e.g. "AI Providers" → "AiProviders"). */
export const tagToPascalClassName = (tag: string): string => {
  return tag
    .split(/\s+/)
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
};

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

/** Metadata for a single CLI flag, used to render `--help` output. */
export interface Flag {
  /** flag name in snake_case (e.g. project_id) */
  name: string;
  description: string;
  required: boolean;
  type: string;
  /** where the value is sent: path, query, or body */
  in: 'path' | 'query' | 'body';
}

export interface Route {
  serviceClass: string;
  operationId: string;
  /** operation summary/description */
  description: string;
  /** URL to module documentation page */
  moduleDocsUrl: string;
  /** HTTP method the operation is mounted on */
  httpMethod: (typeof HTTP_METHODS)[number];
  /** snake_case path parameter names */
  pathParams: string[];
  /** snake_case query parameter names */
  queryParams: string[];
  /** snake_case flags (path, query, body) with metadata for --help. */
  flags: Flag[];
}

/** Resolves same-file `$ref`s against a single spec's `components`. */
interface RefResolvers {
  resolveParam: (p: OpenApiParameterFull) => OpenApiParameterFull;
  resolveSchema: (
    schema: OpenApiRequestBodySchema & { $ref?: string }
  ) => OpenApiRequestBodySchema;
  resolveProperty: (
    property: OpenApiRequestBodyProperty
  ) => OpenApiRequestBodyProperty;
}

const createRefResolvers = (spec: CliOpenApiSpec): RefResolvers => {
  return {
    resolveParam: (p) => {
      if (!p.$ref) return p;
      const refKey = p.$ref.replace('#/components/parameters/', '');
      return spec.components?.parameters?.[refKey] ?? p;
    },
    resolveSchema: (schema) => {
      if (!schema.$ref) return schema;
      const refKey = schema.$ref.replace('#/components/schemas/', '');
      return spec.components?.schemas?.[refKey] ?? schema;
    },
    resolveProperty: (property) => {
      if (!property.$ref?.startsWith('#/components/schemas/')) return property;
      const refKey = property.$ref.replace('#/components/schemas/', '');
      return spec.components?.schemas?.[refKey] ?? property;
    },
  };
};

/** Merges path-level parameters with operation-level ones (operation wins on name collision). */
const mergeParams = (args: {
  pathLevelParams: OpenApiParameterFull[];
  opParams: OpenApiParameterFull[];
}): OpenApiParameterFull[] => {
  const { pathLevelParams, opParams } = args;
  const opParamNames = new Set(
    opParams.map((p) => {
      return p.name;
    })
  );
  return [
    ...pathLevelParams.filter((p) => {
      return !opParamNames.has(p.name);
    }),
    ...opParams,
  ];
};

const buildParamFlags = (params: OpenApiParameterFull[]): Flag[] => {
  return params
    .filter((p): p is OpenApiParameterFull & { in: 'path' | 'query' } => {
      return p.in === 'path' || p.in === 'query';
    })
    .map((p) => {
      return {
        name: p.name,
        description: p.description ?? '',
        required: p.required ?? p.in === 'path',
        type: p.schema?.type ?? 'string',
        in: p.in,
      };
    });
};

/** Collects a schema's own properties into `mergedProperties`/`requiredInAll` (first-schema-wins per property). */
const collectSchemaProperties = (args: {
  schema: OpenApiRequestBodySchema;
  resolveProperty: RefResolvers['resolveProperty'];
  mergedProperties: Record<string, OpenApiRequestBodyProperty>;
  requiredInAll: Set<string>;
}) => {
  const { schema, resolveProperty, mergedProperties, requiredInAll } = args;
  if (!schema.properties) return;

  const required = new Set(schema.required ?? []);
  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    if (mergedProperties[propName]) continue;
    mergedProperties[propName] = resolveProperty(propSchema);
    if (required.has(propName)) requiredInAll.add(propName);
  }
};

/**
 * Builds body flags from a requestBody schema. `oneOf` variants are merged
 * into one flag set; a field is only required when every variant requires
 * it (or, with no `oneOf`, when the single schema requires it).
 */
const buildBodyFlags = (args: {
  bodySchema: OpenApiRequestBodySchema;
  resolveProperty: RefResolvers['resolveProperty'];
}): Flag[] => {
  const { bodySchema, resolveProperty } = args;
  const variants = bodySchema.oneOf ?? [bodySchema];

  const mergedProperties: Record<string, OpenApiRequestBodyProperty> = {};
  const requiredInAll = new Set<string>();
  for (const variant of variants) {
    collectSchemaProperties({
      schema: variant,
      resolveProperty,
      mergedProperties,
      requiredInAll,
    });
  }

  const isRequired = (propName: string): boolean => {
    if (!bodySchema.oneOf) return requiredInAll.has(propName);
    return bodySchema.oneOf.every((variant) => {
      return variant.required?.includes(propName);
    });
  };

  return Object.entries(mergedProperties).map(([propName, propSchema]) => {
    return {
      name: propName,
      description: propSchema.description ?? '',
      required: isRequired(propName),
      type: propSchema.type ?? 'string',
      in: 'body' as const,
    };
  });
};

const buildRoute = (args: {
  op: OpenApiOperation & { operationId: string };
  method: (typeof HTTP_METHODS)[number];
  tag: string;
  params: OpenApiParameterFull[];
  bodySchema: OpenApiRequestBodySchema | undefined;
  resolveProperty: RefResolvers['resolveProperty'];
  tagToClassName: (tag: string) => string;
  moduleDocsUrl: string;
}): Route => {
  const {
    op,
    method,
    tag,
    params,
    bodySchema,
    resolveProperty,
    tagToClassName,
    moduleDocsUrl,
  } = args;

  const flags = buildParamFlags(params);
  if (bodySchema) {
    flags.push(...buildBodyFlags({ bodySchema, resolveProperty }));
  }

  return {
    serviceClass: tagToClassName(tag),
    operationId: op.operationId,
    description: (op.description ?? op.summary ?? op.operationId)
      .replace(/\s+/g, ' ')
      .trim(),
    moduleDocsUrl,
    httpMethod: method,
    pathParams: params
      .filter((p) => {
        return p.in === 'path';
      })
      .map((p) => {
        return p.name;
      }),
    queryParams: params
      .filter((p) => {
        return p.in === 'query';
      })
      .map((p) => {
        return p.name;
      }),
    flags,
  };
};

const getBodySchema = (args: {
  op: OpenApiOperation;
  resolvers: RefResolvers;
}): OpenApiRequestBodySchema | undefined => {
  const { op, resolvers } = args;
  const rawBodySchema = op.requestBody?.content?.['application/json']?.schema;
  if (!rawBodySchema) return undefined;
  return resolvers.resolveSchema(
    rawBodySchema as OpenApiRequestBodySchema & { $ref?: string }
  );
};

const processPathItem = (args: {
  pathItem: OpenApiPathItem;
  moduleTag: string | undefined;
  docsUrl: string;
  resolvers: RefResolvers;
  operationIdToCommand: (operationId: string) => string;
  tagToClassName: (tag: string) => string;
  routes: Record<string, Route>;
}) => {
  const {
    pathItem,
    moduleTag,
    docsUrl,
    resolvers,
    operationIdToCommand,
    tagToClassName,
    routes,
  } = args;
  const pathLevelParams = (pathItem.parameters ?? []).map(
    resolvers.resolveParam
  );

  for (const method of HTTP_METHODS) {
    const op = (pathItem as Record<string, OpenApiOperation>)[method];
    if (!op?.operationId) continue;

    const tag = op.tags?.[0] ?? moduleTag;
    if (!tag) continue;

    const opParams = (op.parameters ?? []).map(resolvers.resolveParam);
    const params = mergeParams({ pathLevelParams, opParams });
    const bodySchema = getBodySchema({ op, resolvers });

    const command = operationIdToCommand(op.operationId);
    routes[command] = buildRoute({
      op: op as OpenApiOperation & { operationId: string },
      method,
      tag,
      params,
      bodySchema,
      resolveProperty: resolvers.resolveProperty,
      tagToClassName,
      moduleDocsUrl: docsUrl,
    });
  }
};

const processSpecFile = (args: {
  filePath: string;
  moduleDocsUrl: (moduleSlug: string) => string;
  operationIdToCommand: (operationId: string) => string;
  tagToClassName: (tag: string) => string;
  routes: Record<string, Route>;
}) => {
  const {
    filePath,
    moduleDocsUrl,
    operationIdToCommand,
    tagToClassName,
    routes,
  } = args;

  const spec = load(fs.readFileSync(filePath, 'utf8')) as CliOpenApiSpec;
  const moduleSlug = path.basename(filePath, path.extname(filePath));
  const docsUrl = moduleDocsUrl(moduleSlug);
  const moduleTag = spec.tags?.[0]?.name;
  const resolvers = createRefResolvers(spec);

  for (const pathItem of Object.values(spec.paths ?? {})) {
    processPathItem({
      pathItem,
      moduleTag,
      docsUrl,
      resolvers,
      operationIdToCommand,
      tagToClassName,
      routes,
    });
  }
};

export interface GenerateCliRouteManifestArgs {
  /** Directory containing one `.yaml`/`.yml` OpenAPI spec file per module. */
  specsDir: string;
  /** Builds the documentation URL for a module, given its spec filename (without extension). */
  moduleDocsUrl: (moduleSlug: string) => string;
  /** Converts an `operationId` to a CLI command name. Defaults to kebab-case. */
  operationIdToCommand?: (operationId: string) => string;
  /** Converts a tag to the SDK service class name. Defaults to PascalCase. */
  tagToClassName?: (tag: string) => string;
}

/**
 * Reads every `.yaml`/`.yml` OpenAPI spec file in `specsDir` and builds a
 * route manifest — a map from CLI command name to the SDK service class,
 * operation, and flag metadata needed to dispatch and document that command.
 */
export const generateCliRouteManifest = (
  args: GenerateCliRouteManifestArgs
): Record<string, Route> => {
  const {
    specsDir,
    moduleDocsUrl,
    operationIdToCommand = operationIdToKebabCommand,
    tagToClassName = tagToPascalClassName,
  } = args;

  const routes: Record<string, Route> = {};

  const files = fs
    .readdirSync(specsDir)
    .filter((file) => {
      return file.endsWith('.yaml') || file.endsWith('.yml');
    })
    .sort();

  for (const file of files) {
    processSpecFile({
      filePath: path.join(specsDir, file),
      moduleDocsUrl,
      operationIdToCommand,
      tagToClassName,
      routes,
    });
  }

  return routes;
};
