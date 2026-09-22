import fs from 'node:fs';
import path from 'node:path';

import type {
  ParameterLocation,
  ResolvedParam,
  ResolvedSchema,
  SchemaResolver,
  SpecIndex,
  SpecResolvers,
} from './createSpecIndex';
import { createSpecIndex } from './createSpecIndex';
import type {
  OpenApiOperation,
  OpenApiParameterFull,
  OpenApiPathItem,
  OpenApiSchema,
} from './openApiOperationTypes';

/** Where a parameter is sent — part of every {@link Flag}. */
export type { ParameterLocation };

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

/** Merges path-level parameters with operation-level ones (operation wins on name collision). */
const mergeParams = (args: {
  pathLevelParams: ResolvedParam[];
  opParams: ResolvedParam[];
}): ResolvedParam[] => {
  const { pathLevelParams, opParams } = args;
  const opParamNames = new Set(
    opParams.map((p) => {
      return p.value.name;
    })
  );
  return [
    ...pathLevelParams.filter((p) => {
      return !opParamNames.has(p.value.name);
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
  resolveSchema: SchemaResolver;
  /** Schemas already being typed, so a self-referential union terminates. */
  visited?: Set<OpenApiSchema>;
}): string => {
  const { schema, resolveSchema, visited = new Set<OpenApiSchema>() } = args;
  if (!schema) return UNKNOWN_FLAG_TYPE;

  const resolved = resolveSchema({ schema });
  if (resolved.value.type) return resolved.value.type;
  if (visited.has(resolved.value)) return UNKNOWN_FLAG_TYPE;
  visited.add(resolved.value);

  const typeOf = (member: OpenApiSchema): string => {
    return deriveFlagType({
      // Members are read by the resolver of the file the schema came from,
      // which is the file their own refs are relative to.
      resolveSchema: resolved.resolveSchema,
      schema: member,
      // A copy per member: `visited` guards the path being followed, so a
      // schema two members happen to share is typed for both rather than
      // given up on for the second.
      visited: new Set(visited),
    });
  };

  const union = resolved.value.oneOf ?? resolved.value.anyOf;
  if (union) return agreedType(union.map(typeOf));

  return firstKnownType((resolved.value.allOf ?? []).map(typeOf));
};

/**
 * Builds one flag per parameter, whatever its location. `resolveParam` has
 * already rejected anything that is not a valid location, so no parameter
 * can reach here and be dropped.
 */
const buildParamFlags = (params: ResolvedParam[]): Flag[] => {
  return params.map(({ resolveSchema, value: p }) => {
    return {
      name: p.name,
      description: p.description ?? '',
      // OpenAPI requires path parameters to be required; others default to optional.
      required: p.required ?? p.in === 'path',
      type: deriveFlagType({ resolveSchema, schema: p.schema }),
      in: p.in,
    };
  });
};

/** Names of the parameters sent in a given location, in spec order. */
const paramNamesIn = (args: {
  params: ResolvedParam[];
  location: ParameterLocation;
}): string[] => {
  const { params, location } = args;
  return params
    .filter((p) => {
      return p.value.in === location;
    })
    .map((p) => {
      return p.value.name;
    });
};

/** Collects a variant's own properties into `mergedProperties`/`requiredInAll` (first-schema-wins per property). */
const collectSchemaProperties = (args: {
  variant: ResolvedSchema;
  mergedProperties: Record<string, ResolvedSchema>;
  requiredInAll: Set<string>;
}) => {
  const { variant, mergedProperties, requiredInAll } = args;
  const { resolveSchema, value: schema } = variant;
  if (!schema.properties) return;

  const required = new Set(schema.required ?? []);
  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    if (mergedProperties[propName]) continue;
    mergedProperties[propName] = resolveSchema({ schema: propSchema });
    if (required.has(propName)) requiredInAll.add(propName);
  }
};

/**
 * Builds body flags from a requestBody schema. `oneOf` variants are merged
 * into one flag set; a field is only required when every variant requires
 * it (or, with no `oneOf`, when the single schema requires it).
 */
const buildBodyFlags = (bodySchema: ResolvedSchema): Flag[] => {
  const { resolveSchema, value: schema } = bodySchema;
  // Variants are resolved up front so a `oneOf` of `$ref`s contributes its
  // targets' properties instead of nothing at all.
  const variants = (schema.oneOf ?? [schema]).map((variant) => {
    return resolveSchema({ schema: variant });
  });

  const mergedProperties: Record<string, ResolvedSchema> = {};
  const requiredInAll = new Set<string>();
  for (const variant of variants) {
    collectSchemaProperties({ mergedProperties, requiredInAll, variant });
  }

  const isRequired = (propName: string): boolean => {
    if (!schema.oneOf) return requiredInAll.has(propName);
    return variants.every((variant) => {
      return variant.value.required?.includes(propName);
    });
  };

  return Object.entries(mergedProperties).map(([propName, prop]) => {
    return {
      name: propName,
      description: prop.value.description ?? '',
      required: isRequired(propName),
      type: deriveFlagType({
        resolveSchema: prop.resolveSchema,
        schema: prop.value,
      }),
      in: 'body' as const,
    };
  });
};

const buildRoute = (args: {
  op: OpenApiOperation & { operationId: string };
  method: (typeof HTTP_METHODS)[number];
  tag: string;
  params: ResolvedParam[];
  bodySchema: ResolvedSchema | undefined;
  tagToClassName: (tag: string) => string;
  moduleDocsUrl: string;
}): Route => {
  const { op, method, tag, params, bodySchema, tagToClassName, moduleDocsUrl } =
    args;

  const flags = buildParamFlags(params);
  if (bodySchema) {
    flags.push(...buildBodyFlags(bodySchema));
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
  resolvers: SpecResolvers;
}): ResolvedSchema | undefined => {
  const { op, resolvers } = args;
  const rawBodySchema = op.requestBody?.content?.['application/json']?.schema;
  if (!rawBodySchema) return undefined;
  return resolvers.resolveSchema({ schema: rawBodySchema });
};

const processPathItem = (args: {
  pathItem: OpenApiPathItem;
  moduleTag: string | undefined;
  docsUrl: string;
  resolvers: SpecResolvers;
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
  const resolveParam = (param: OpenApiParameterFull): ResolvedParam => {
    return resolvers.resolveParam({ param });
  };
  const pathLevelParams = (pathItem.parameters ?? []).map(resolveParam);

  for (const method of HTTP_METHODS) {
    const op = (pathItem as Record<string, OpenApiOperation>)[method];
    if (!op?.operationId) continue;

    const tag = op.tags?.[0] ?? moduleTag;
    if (!tag) continue;

    const opParams = (op.parameters ?? []).map(resolveParam);
    const params = mergeParams({ pathLevelParams, opParams });
    const bodySchema = getBodySchema({ op, resolvers });

    const command = operationIdToCommand(op.operationId);
    routes[command] = buildRoute({
      op: op as OpenApiOperation & { operationId: string },
      method,
      tag,
      params,
      bodySchema,
      tagToClassName,
      moduleDocsUrl: docsUrl,
    });
  }
};

const processSpecFile = (args: {
  specPath: string;
  index: SpecIndex;
  moduleDocsUrl: (moduleSlug: string) => string;
  operationIdToCommand: (operationId: string) => string;
  tagToClassName: (tag: string) => string;
  routes: Record<string, Route>;
}) => {
  const {
    specPath,
    index,
    moduleDocsUrl,
    operationIdToCommand,
    tagToClassName,
    routes,
  } = args;

  const spec = index.specFor(specPath);
  const moduleSlug = path.basename(specPath, path.extname(specPath));
  const docsUrl = moduleDocsUrl(moduleSlug);
  const moduleTag = spec.tags?.[0]?.name;
  const resolvers = index.resolversFor(specPath);

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
 *
 * A spec may `$ref` components out of another file, which is read relative to
 * the spec that points at it; the file it lives in need not be one of the
 * modules in `specsDir`.
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
  const index = createSpecIndex();

  const files = fs
    .readdirSync(specsDir)
    .filter((file) => {
      return file.endsWith('.yaml') || file.endsWith('.yml');
    })
    .sort();

  for (const file of files) {
    processSpecFile({
      // Absolute, so the same document reached as a module and as the target
      // of a `$ref` is the same entry in the index.
      specPath: path.resolve(specsDir, file),
      index,
      moduleDocsUrl,
      operationIdToCommand,
      tagToClassName,
      routes,
    });
  }

  return routes;
};
