import fs from 'node:fs';
import path from 'node:path';

import { load } from 'js-yaml';

import { parseRef } from './parseRef';
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

/** The `components` sections a `$ref` can pull a definition out of. */
const PULLABLE_SECTIONS = ['schemas', 'responses', 'parameters'] as const;

type PullableSection = (typeof PULLABLE_SECTIONS)[number];

const COMPONENT_POINTER =
  /^\/components\/(schemas|responses|parameters)\/([^/]+)$/;

/** A value whose `$ref`s are still to be followed, and the file that wrote it. */
interface PendingValue {
  value: unknown;
  specPath: string;
}

/** A component a `$ref` names, read out of the file that declares it. */
interface PulledComponent {
  key: string;
  name: string;
  section: PullableSection;
  specPath: string;
  value: unknown;
}

/** Every `$ref` string inside a value, however deeply nested. */
const collectRefs = (value: unknown, refs: string[] = []): string[] => {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectRefs(item, refs);
    }
    return refs;
  }

  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === '$ref' && typeof child === 'string') {
        refs.push(child);
      } else {
        collectRefs(child, refs);
      }
    }
  }

  return refs;
};

/** Splits `/components/<section>/<name>` into its parts, for the sections that can be pulled. */
const parsePointer = (
  pointer: string
): { name: string; section: PullableSection } | undefined => {
  const match = COMPONENT_POINTER.exec(pointer);
  if (!match) return undefined;

  // The pattern captures both groups, so neither can be missing here.
  const [, section, name] = match;
  return { name: name as string, section: section as PullableSection };
};

/**
 * Reads the component a `$ref` names out of the file that declares it.
 *
 * A ref with no file part may be answered by the merged namespace rather than
 * by the file that wrote it — specs are written against the merged document,
 * not against themselves — so one that leads nowhere is left alone. An
 * explicit cross-file ref has no such excuse: it names a file and a component
 * in it, and `rewriteCrossFileRefs` is about to make it local, so a ref that
 * cannot be pulled would become a ref into nothing.
 */
const resolvePulledComponent = (args: {
  ref: string;
  fromSpecPath: string;
  loadSpec: (specPath: string) => OpenApiSpec;
}): PulledComponent | undefined => {
  const { ref, fromSpecPath, loadSpec } = args;
  const sameFile = ref.startsWith('#');
  const { pointer, remote, specPath } = parseRef({ ref, fromSpecPath });

  const fail = (reason: string): Error => {
    return new Error(`${fromSpecPath}: cannot pull $ref "${ref}". ${reason}`);
  };

  if (remote) {
    throw fail('Refs into a remote document are not supported.');
  }

  const target = parsePointer(pointer);

  if (!target) {
    if (sameFile) return undefined;
    throw fail(
      `Expected a ref into one of: ${PULLABLE_SECTIONS.map((section) => {
        return `\`components.${section}\``;
      }).join(', ')}.`
    );
  }

  if (!fs.existsSync(specPath)) {
    throw fail(`No such file: "${specPath}".`);
  }

  const value = loadSpec(specPath).components?.[target.section]?.[target.name];

  if (!value) {
    if (sameFile) return undefined;
    throw fail(
      `"${specPath}" declares no \`components.${target.section}.${target.name}\`.`
    );
  }

  return { ...target, key: `${specPath}#${pointer}`, specPath, value };
};

/**
 * Adds a pulled component under the name it already has, which is the name
 * the ref about to be made local will look for. A name a different definition
 * already holds throws rather than quietly losing one of the two: unlike the
 * first-file-wins collision between two spec files, here the ref that lost
 * would silently point at the definition that won.
 */
const mergePulledComponent = (args: {
  merged: OpenApiSpec;
  component: PulledComponent;
}) => {
  const { merged, component } = args;
  const section = merged.components![component.section]!;
  const existing = section[component.name];

  if (existing === undefined) {
    section[component.name] = component.value;
    return;
  }

  if (JSON.stringify(existing) !== JSON.stringify(component.value)) {
    throw new Error(
      `${component.specPath}: cannot pull \`components.${component.section}.` +
        `${component.name}\` into the merged document, which already holds a ` +
        'different definition of that name. Rename one of them.'
    );
  }
};

/**
 * Follows every `$ref` reachable from the spec files and pulls the components
 * they name into the merged document, so a file that is referenced but not in
 * `specsDir` contributes the definitions that are actually used. Each pulled
 * component is followed in turn, reading its own refs relative to the file
 * that declares it.
 */
const pullReferencedComponents = (args: {
  merged: OpenApiSpec;
  pending: PendingValue[];
  loadSpec: (specPath: string) => OpenApiSpec;
}) => {
  const { merged, pending, loadSpec } = args;
  const pulled = new Set<string>();
  let next = pending.pop();

  while (next) {
    const { specPath: fromSpecPath, value } = next;

    for (const ref of collectRefs(value)) {
      const component = resolvePulledComponent({ fromSpecPath, loadSpec, ref });

      if (component && !pulled.has(component.key)) {
        pulled.add(component.key);
        mergePulledComponent({ component, merged });
        pending.push({ specPath: component.specPath, value: component.value });
      }
    }

    next = pending.pop();
  }
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
 * A `$ref` into a file that is not in `specsDir` — a shared components file —
 * pulls the component it names into the merged document, along with whatever
 * that component refs in turn, so the rewritten local ref has something to
 * point at.
 *
 * Files are read in sorted filename order, so merge order — and therefore
 * which file wins a naming collision — is deterministic.
 */
export const mergeOpenApiSpecs = (args: MergeOpenApiSpecsArgs): OpenApiSpec => {
  const { specsDir, info, openapiVersion = '3.0.3' } = args;

  const specs = new Map<string, OpenApiSpec>();

  const loadSpec = (specPath: string): OpenApiSpec => {
    const cached = specs.get(specPath);
    if (cached) return cached;

    const spec = load(fs.readFileSync(specPath, 'utf-8')) as OpenApiSpec;
    specs.set(specPath, spec);
    return spec;
  };

  const specFiles = fs
    .readdirSync(specsDir)
    .filter((file) => {
      return file.endsWith('.yaml') || file.endsWith('.yml');
    })
    .sort()
    .map((file) => {
      // Absolute, so a file reached both as a spec and as the target of a
      // `$ref` is read — and keyed — once.
      return path.resolve(specsDir, file);
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

  const pending: PendingValue[] = [];

  for (const specPath of specFiles) {
    const spec = loadSpec(specPath);
    mergeSpecFile({ merged, spec });
    pending.push({ specPath, value: spec });
  }

  pullReferencedComponents({ loadSpec, merged, pending });

  return rewriteCrossFileRefs(merged);
};
