import fs from 'node:fs';
import path from 'node:path';

import { load } from 'js-yaml';

import type { OpenApiSpec } from './types';

/**
 * Merges a section of `components` (`schemas`, `responses`, `parameters`)
 * across spec files. The first file to define a given key wins — later
 * files defining the same key are ignored, mirroring how a single merged
 * document can only hold one definition per name.
 */
const mergeComponentSection = (
  target: Record<string, unknown>,
  source: Record<string, unknown> | undefined
) => {
  if (!source) {
    return;
  }

  for (const [name, value] of Object.entries(source)) {
    if (!(name in target)) {
      target[name] = value;
    }
  }
};

/**
 * Rewrites cross-file `$ref`s (e.g. `./widgets.yaml#/components/schemas/Widget`)
 * to local refs (`#/components/schemas/Widget`). Once every file's
 * `components` are collected into a single merged document, the relative
 * file path in the ref is no longer resolvable — everything lives under one
 * root now.
 */
const rewriteCrossFileRefs = (spec: OpenApiSpec): OpenApiSpec => {
  const specJson = JSON.stringify(spec).replace(
    /"(\$ref)":\s*"[^"]*\.ya?ml#(\/components\/[^"]+)"/g,
    '"$1": "#$2"'
  );

  return JSON.parse(specJson) as OpenApiSpec;
};

/** Keeps the first non-empty `servers` array found across spec files. */
const mergeServers = (args: { merged: OpenApiSpec; spec: OpenApiSpec }) => {
  const { merged, spec } = args;
  if (!merged.servers?.length && spec.servers?.length) {
    merged.servers = spec.servers;
  }
};

const mergePaths = (args: { merged: OpenApiSpec; spec: OpenApiSpec }) => {
  const { merged, spec } = args;
  if (spec.paths) {
    Object.assign(merged.paths!, spec.paths);
  }
};

const mergeSecuritySchemes = (args: {
  merged: OpenApiSpec;
  spec: OpenApiSpec;
}) => {
  const { merged, spec } = args;
  Object.assign(
    merged.components!.securitySchemes!,
    spec.components?.securitySchemes ?? {}
  );
};

/**
 * Merges a single parsed spec into the accumulator: combines `paths`,
 * `components` (first-file-wins on collisions), `securitySchemes`, and
 * keeps the first non-empty `servers` array found.
 */
const mergeSpecFile = (args: { merged: OpenApiSpec; spec: OpenApiSpec }) => {
  const { merged, spec } = args;

  mergeServers({ merged, spec });
  mergePaths({ merged, spec });
  mergeComponentSection(merged.components!.schemas!, spec.components?.schemas);
  mergeComponentSection(
    merged.components!.responses!,
    spec.components?.responses
  );
  mergeComponentSection(
    merged.components!.parameters!,
    spec.components?.parameters
  );
  mergeSecuritySchemes({ merged, spec });
};

export interface MergeOpenApiSpecsArgs {
  /** Directory containing one `.yaml`/`.yml` OpenAPI spec file per module. */
  specsDir: string;
  /** `info` object for the merged document. Omitted if not provided. */
  info?: Record<string, unknown>;
  /** OpenAPI version to stamp on the merged document. Defaults to `3.0.3`. */
  openapiVersion?: string;
}

/**
 * Merges every `.yaml`/`.yml` OpenAPI spec file in `specsDir` into a single
 * OpenAPI document: `paths` are combined, `components` are combined
 * (first-file-wins on name collisions), the first non-empty `servers` array
 * found is kept, and cross-file `$ref`s are rewritten to local refs.
 *
 * Files are read in sorted filename order, so merge order — and therefore
 * which file wins a naming collision — is deterministic.
 */
export const mergeOpenApiSpecs = (args: MergeOpenApiSpecsArgs): OpenApiSpec => {
  const { specsDir, info, openapiVersion = '3.0.3' } = args;

  const specFiles = fs
    .readdirSync(specsDir)
    .filter((file) => {
      return file.endsWith('.yaml') || file.endsWith('.yml');
    })
    .sort()
    .map((file) => {
      return path.join(specsDir, file);
    });

  const merged: OpenApiSpec = {
    openapi: openapiVersion,
    ...(info ? { info } : {}),
    servers: [],
    paths: {},
    components: {
      schemas: {},
      responses: {},
      securitySchemes: {},
      parameters: {},
    },
  };

  for (const file of specFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const spec = load(content) as OpenApiSpec;
    mergeSpecFile({ merged, spec });
  }

  return rewriteCrossFileRefs(merged);
};
