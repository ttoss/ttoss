import fs from 'node:fs';
import path from 'node:path';

import { load } from 'js-yaml';

import type {
  CliOpenApiSpec,
  OpenApiOperation,
  OpenApiParameterFull,
  OpenApiPathItem,
  OpenApiSchema,
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

/**
 * Every location OpenAPI allows a parameter to live in. All four become CLI
 * flags: a parameter a spec declares but the CLI never exposes is invisible
 * to the person running `--help`, so there is no "unsupported location" case
 * that silently drops one.
 */
const PARAMETER_LOCATIONS = ['path', 'query', 'header', 'cookie'] as const;

export type ParameterLocation = (typeof PARAMETER_LOCATIONS)[number];

/**
 * The type given to a flag whose schema does not pin the value to a single
 * JSON type: a `oneOf`/`anyOf` whose members disagree, or a schema with no
 * `type` at all.
 *
 * It is deliberately not `string`. In OpenAPI 3.0 an absent `type` means
 * "unconstrained", not "text" — 3.0 has no union `type`, so every
 * `oneOf`/`anyOf` schema omits it — and `string` is the one type a CLI must
 * *not* JSON-parse, since parsing would mangle values that are legitimately
 * text (a PEM key, a JSON blob the API wants as an opaque string). Guessing
 * `string` therefore sends an object flag to the server as text, and leaves
 * the manifest unable to tell "the spec says string" from "the generator
 * gave up".
 */
export const UNKNOWN_FLAG_TYPE = 'unknown';

/** Metadata for a single CLI flag, used to render `--help` output. */
export interface Flag {
  /** flag name in snake_case (e.g. project_id) */
  name: string;
  description: string;
  required: boolean;
  /**
   * The schema's JSON type, or {@link UNKNOWN_FLAG_TYPE} when the schema
   * admits more than one — a consumer should JSON-parse those rather than
   * send them as text.
   */
  type: string;
  /** where the value is sent: a parameter location, or the request body */
  in: ParameterLocation | 'body';
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
  /** snake_case header parameter names */
  headerParams: string[];
  /** snake_case cookie parameter names */
  cookieParams: string[];
  /** snake_case flags (every parameter location, plus body) with metadata for --help. */
  flags: Flag[];
}

const SCHEMA_REF_PREFIX = '#/components/schemas/';

/** Resolves same-file `$ref`s against a single spec's `components`. */
interface RefResolvers {
  /**
   * Resolves a parameter and validates it, throwing when it cannot be
   * resolved or declares an unknown location — both cases used to drop the
   * parameter from the generated CLI without a word.
   */
  resolveParam: (p: OpenApiParameterFull) => OpenApiParameterFull;
  /**
   * Resolves a schema `$ref` — a request body, a body property, a `oneOf`
   * member — following a chain of them, and throws when it cannot. Returning
   * the raw `{ $ref }` object instead, as this used to, strips the schema of
   * its `type` and so degrades the flag to {@link UNKNOWN_FLAG_TYPE} with
   * nothing naming the ref that could not be found.
   */
  resolveSchema: (schema: OpenApiSchema) => OpenApiSchema;
}

const createRefResolvers = (args: {
  spec: CliOpenApiSpec;
  specLabel: string;
}): RefResolvers => {
  const { spec, specLabel } = args;

  return {
    resolveParam: (p) => {
      const refKey = p.$ref?.replace('#/components/parameters/', '');
      const resolved = refKey ? spec.components?.parameters?.[refKey] : p;

      if (!resolved) {
        throw new Error(
          `${specLabel}: cannot resolve parameter $ref "${p.$ref}". Only ` +
            'same-file refs into `components.parameters` are supported.'
        );
      }

      if (!PARAMETER_LOCATIONS.includes(resolved.in)) {
        throw new Error(
          `${specLabel}: parameter "${resolved.name}" declares \`in: ` +
            `${resolved.in}\`, which is not a valid OpenAPI parameter ` +
            `location. Expected one of: ${PARAMETER_LOCATIONS.join(', ')}.`
        );
      }

      return resolved;
    },
    resolveSchema: (schema) => {
      const seen = new Set<string>();
      let current = schema;

      while (current.$ref) {
        if (seen.has(current.$ref)) {
          throw new Error(
            `${specLabel}: schema $ref "${current.$ref}" is part of a ` +
              '$ref cycle.'
          );
        }
        seen.add(current.$ref);

        const resolved = current.$ref.startsWith(SCHEMA_REF_PREFIX)
          ? spec.components?.schemas?.[
              current.$ref.slice(SCHEMA_REF_PREFIX.length)
            ]
          : undefined;

        if (!resolved) {
          throw new Error(
            `${specLabel}: cannot resolve schema $ref "${current.$ref}". ` +
              'Only same-file refs into `components.schemas` are supported.'
          );
        }

        current = resolved;
      }

      return current;
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

/** The single type a union's members agree on, if they agree at all. */
const agreedType = (memberTypes: string[]): string => {
  const distinct = new Set(memberTypes);
  const [only] = distinct;
  return distinct.size === 1 ? only : UNKNOWN_FLAG_TYPE;
};

/**
 * The first type an intersection's members name. `allOf` members all hold at
 * once, so any one of them naming a type names the whole schema.
 */
const firstKnownType = (memberTypes: string[]): string => {
  return (
    memberTypes.find((type) => {
      return type !== UNKNOWN_FLAG_TYPE;
    }) ?? UNKNOWN_FLAG_TYPE
  );
};

/**
 * Derives a flag's type from its schema, reading through `$ref`s and
 * composition keywords rather than falling back to a guess.
 *
 * A schema that names a `type` is taken at its word. A union (`oneOf` /
 * `anyOf`) is typed only when every member agrees — the members are resolved
 * first, so a union of `$ref`s is read as its targets, not as a set of
 * type-less `{ $ref }` objects. An `allOf` is an intersection, so the first
 * member that names a type names the whole schema. Anything left — a union
 * whose members disagree, a schema with no `type` and no members — is
 * {@link UNKNOWN_FLAG_TYPE}.
 */
const deriveFlagType = (args: {
  schema: OpenApiSchema | undefined;
  resolveSchema: RefResolvers['resolveSchema'];
  /** Schemas already being typed, so a self-referential union terminates. */
  visited?: Set<OpenApiSchema>;
}): string => {
  const { schema, resolveSchema, visited = new Set<OpenApiSchema>() } = args;
  if (!schema) return UNKNOWN_FLAG_TYPE;

  const resolved = resolveSchema(schema);
  if (resolved.type) return resolved.type;
  if (visited.has(resolved)) return UNKNOWN_FLAG_TYPE;
  visited.add(resolved);

  const typeOf = (member: OpenApiSchema): string => {
    return deriveFlagType({
      schema: member,
      resolveSchema,
      // A copy per member: `visited` guards the path being followed, so a
      // schema two members happen to share is typed for both rather than
      // given up on for the second.
      visited: new Set(visited),
    });
  };

  const union = resolved.oneOf ?? resolved.anyOf;
  if (union) return agreedType(union.map(typeOf));

  return firstKnownType((resolved.allOf ?? []).map(typeOf));
};

/**
 * Builds one flag per parameter, whatever its location. `resolveParam` has
 * already rejected anything that is not a valid location, so no parameter
 * can reach here and be dropped.
 */
const buildParamFlags = (args: {
  params: OpenApiParameterFull[];
  resolveSchema: RefResolvers['resolveSchema'];
}): Flag[] => {
  const { params, resolveSchema } = args;
  return params.map((p) => {
    return {
      name: p.name,
      description: p.description ?? '',
      // OpenAPI requires path parameters to be required; others default to optional.
      required: p.required ?? p.in === 'path',
      type: deriveFlagType({ schema: p.schema, resolveSchema }),
      in: p.in,
    };
  });
};

/** Names of the parameters sent in a given location, in spec order. */
const paramNamesIn = (args: {
  params: OpenApiParameterFull[];
  location: ParameterLocation;
}): string[] => {
  const { params, location } = args;
  return params
    .filter((p) => {
      return p.in === location;
    })
    .map((p) => {
      return p.name;
    });
};

/** Collects a schema's own properties into `mergedProperties`/`requiredInAll` (first-schema-wins per property). */
const collectSchemaProperties = (args: {
  schema: OpenApiSchema;
  resolveSchema: RefResolvers['resolveSchema'];
  mergedProperties: Record<string, OpenApiSchema>;
  requiredInAll: Set<string>;
}) => {
  const { schema, resolveSchema, mergedProperties, requiredInAll } = args;
  if (!schema.properties) return;

  const required = new Set(schema.required ?? []);
  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    if (mergedProperties[propName]) continue;
    mergedProperties[propName] = resolveSchema(propSchema);
    if (required.has(propName)) requiredInAll.add(propName);
  }
};

/**
 * Builds body flags from a requestBody schema. `oneOf` variants are merged
 * into one flag set; a field is only required when every variant requires
 * it (or, with no `oneOf`, when the single schema requires it).
 */
const buildBodyFlags = (args: {
  bodySchema: OpenApiSchema;
  resolveSchema: RefResolvers['resolveSchema'];
}): Flag[] => {
  const { bodySchema, resolveSchema } = args;
  // Variants are resolved up front so a `oneOf` of `$ref`s contributes its
  // targets' properties instead of nothing at all.
  const variants = (bodySchema.oneOf ?? [bodySchema]).map(resolveSchema);

  const mergedProperties: Record<string, OpenApiSchema> = {};
  const requiredInAll = new Set<string>();
  for (const variant of variants) {
    collectSchemaProperties({
      schema: variant,
      resolveSchema,
      mergedProperties,
      requiredInAll,
    });
  }

  const isRequired = (propName: string): boolean => {
    if (!bodySchema.oneOf) return requiredInAll.has(propName);
    return variants.every((variant) => {
      return variant.required?.includes(propName);
    });
  };

  return Object.entries(mergedProperties).map(([propName, propSchema]) => {
    return {
      name: propName,
      description: propSchema.description ?? '',
      required: isRequired(propName),
      type: deriveFlagType({ schema: propSchema, resolveSchema }),
      in: 'body' as const,
    };
  });
};

const buildRoute = (args: {
  op: OpenApiOperation & { operationId: string };
  method: (typeof HTTP_METHODS)[number];
  tag: string;
  params: OpenApiParameterFull[];
  bodySchema: OpenApiSchema | undefined;
  resolveSchema: RefResolvers['resolveSchema'];
  tagToClassName: (tag: string) => string;
  moduleDocsUrl: string;
}): Route => {
  const {
    op,
    method,
    tag,
    params,
    bodySchema,
    resolveSchema,
    tagToClassName,
    moduleDocsUrl,
  } = args;

  const flags = buildParamFlags({ params, resolveSchema });
  if (bodySchema) {
    flags.push(...buildBodyFlags({ bodySchema, resolveSchema }));
  }

  return {
    serviceClass: tagToClassName(tag),
    operationId: op.operationId,
    description: (op.description ?? op.summary ?? op.operationId)
      .replace(/\s+/g, ' ')
      .trim(),
    moduleDocsUrl,
    httpMethod: method,
    pathParams: paramNamesIn({ params, location: 'path' }),
    queryParams: paramNamesIn({ params, location: 'query' }),
    headerParams: paramNamesIn({ params, location: 'header' }),
    cookieParams: paramNamesIn({ params, location: 'cookie' }),
    flags,
  };
};

const getBodySchema = (args: {
  op: OpenApiOperation;
  resolvers: RefResolvers;
}): OpenApiSchema | undefined => {
  const { op, resolvers } = args;
  const rawBodySchema = op.requestBody?.content?.['application/json']?.schema;
  if (!rawBodySchema) return undefined;
  return resolvers.resolveSchema(rawBodySchema);
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
      resolveSchema: resolvers.resolveSchema,
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
  const resolvers = createRefResolvers({ spec, specLabel: filePath });

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
