/**
 * Reading OpenAPI `$ref`s for the CLI generator: a document is parsed once and
 * paired with resolvers that read the refs written in it, including the ones
 * naming another file.
 */

import fs from 'node:fs';
import path from 'node:path';

import { load } from 'js-yaml';

import type {
  CliOpenApiSpec,
  OpenApiParameterFull,
  OpenApiSchema,
} from './openApiOperationTypes';

/**
 * Every location OpenAPI allows a parameter to live in. All four become CLI
 * flags: a parameter a spec declares but the CLI never exposes is invisible
 * to the person running `--help`, so there is no "unsupported location" case
 * that silently drops one.
 */
const PARAMETER_LOCATIONS = ['path', 'query', 'header', 'cookie'] as const;

export type ParameterLocation = (typeof PARAMETER_LOCATIONS)[number];

/**
 * A resolved value together with the resolver for the document it came from.
 * A `$ref` written inside a component is relative to the file that declares
 * it, not to the spec that pointed at it, so following one means carrying
 * that file's resolver along with the value it produced.
 */
export interface Resolved<T> {
  value: T;
  resolveSchema: SchemaResolver;
}

export type ResolvedParam = Resolved<OpenApiParameterFull>;

export type ResolvedSchema = Resolved<OpenApiSchema>;

export type SchemaResolver = (args: {
  schema: OpenApiSchema;
  /** Refs already followed on this chain, keyed `<file>#<pointer>`. */
  seen?: Set<string>;
}) => ResolvedSchema;

export type ParamResolver = (args: {
  param: OpenApiParameterFull;
  seen?: Set<string>;
}) => ResolvedParam;

/** Resolves the `$ref`s written in one spec document. */
export interface SpecResolvers {
  /**
   * Resolves a parameter and validates it. A ref it cannot follow, or a
   * location OpenAPI does not define, throws: either one would otherwise
   * drop the parameter from the generated CLI without a word.
   */
  resolveParam: ParamResolver;
  /**
   * Resolves a schema `$ref` — a request body, a body property, a `oneOf`
   * member — following a chain of them, and throws when it cannot. Handing
   * back the raw `{ $ref }` object instead would strip the schema of its
   * `type` and leave the flag it types resting on a guess, with nothing
   * naming the ref that could not be found.
   */
  resolveSchema: SchemaResolver;
}

const REF_SECTION_LABEL = {
  parameters: 'parameter',
  schemas: 'schema',
} as const;

type RefSection = keyof typeof REF_SECTION_LABEL;

/** A `$ref` naming a document to fetch over the network rather than a file. */
const REMOTE_REF = /^[a-z][a-z\d+.-]*:\/\//i;

/**
 * Splits a `$ref` into the document it names and the pointer into it. A ref
 * with no file part is same-file; a file part is resolved against the
 * directory of the spec that wrote it, so a shared components file can point
 * at a third file of its own and be read from wherever it is referenced.
 */
const parseRef = (args: {
  ref: string;
  fromSpecPath: string;
}): { pointer: string; remote: boolean; specPath: string } => {
  const { ref, fromSpecPath } = args;
  const [filePart, pointer = ''] = ref.split('#');

  return {
    pointer,
    remote: Boolean(filePart && REMOTE_REF.test(filePart)),
    specPath: filePart
      ? path.resolve(path.dirname(fromSpecPath), filePart)
      : fromSpecPath,
  };
};

/**
 * Reads the component a `$ref` names, from this document or from the file the
 * ref points into, and throws — naming the spec that wrote the ref and what
 * was missing — when it cannot.
 */
const lookupRef = <T>(args: {
  ref: string;
  section: RefSection;
  fromSpecPath: string;
  specFor: (specPath: string) => CliOpenApiSpec;
  pick: (spec: CliOpenApiSpec) => Record<string, T> | undefined;
}): { key: string; specPath: string; value: T } => {
  const { ref, section, fromSpecPath, specFor, pick } = args;

  const refError = (reason: string): Error => {
    return new Error(
      `${fromSpecPath}: cannot resolve ${REF_SECTION_LABEL[section]} $ref ` +
        `"${ref}". ${reason}`
    );
  };

  const { pointer, remote, specPath } = parseRef({ ref, fromSpecPath });
  const prefix = `/components/${section}/`;
  const name = pointer.startsWith(prefix) ? pointer.slice(prefix.length) : '';

  if (!name) {
    throw refError(`Expected a ref into \`components.${section}\`.`);
  }

  if (remote) {
    throw refError('Refs into a remote document are not supported.');
  }

  if (!fs.existsSync(specPath)) {
    throw refError(`No such file: "${specPath}".`);
  }

  const value = pick(specFor(specPath))?.[name];

  if (!value) {
    throw refError(
      `"${specPath}" declares no \`components.${section}.${name}\`.`
    );
  }

  return { key: `${specPath}#${pointer}`, specPath, value };
};

/**
 * Builds the resolvers for one spec document. A ref into another file hands
 * the rest of the resolution to that file's resolvers, so a chain of refs is
 * followed across files, each hop read relative to the file that wrote it.
 */
const createDocumentResolvers = (args: {
  specPath: string;
  specFor: (specPath: string) => CliOpenApiSpec;
  resolversFor: (specPath: string) => SpecResolvers;
}): SpecResolvers => {
  const { specPath, specFor, resolversFor } = args;

  const resolveSchema: SchemaResolver = ({
    schema,
    seen = new Set<string>(),
  }) => {
    if (!schema.$ref) return { resolveSchema, value: schema };

    const target = lookupRef({
      fromSpecPath: specPath,
      pick: (spec) => {
        return spec.components?.schemas;
      },
      ref: schema.$ref,
      section: 'schemas',
      specFor,
    });

    if (seen.has(target.key)) {
      throw new Error(
        `${specPath}: schema $ref "${schema.$ref}" is part of a $ref cycle.`
      );
    }
    seen.add(target.key);

    return resolversFor(target.specPath).resolveSchema({
      schema: target.value,
      seen,
    });
  };

  const resolveParam: ParamResolver = ({ param, seen = new Set<string>() }) => {
    if (param.$ref) {
      const target = lookupRef({
        fromSpecPath: specPath,
        pick: (spec) => {
          return spec.components?.parameters;
        },
        ref: param.$ref,
        section: 'parameters',
        specFor,
      });

      if (seen.has(target.key)) {
        throw new Error(
          `${specPath}: parameter $ref "${param.$ref}" is part of a $ref cycle.`
        );
      }
      seen.add(target.key);

      return resolversFor(target.specPath).resolveParam({
        param: target.value,
        seen,
      });
    }

    if (!PARAMETER_LOCATIONS.includes(param.in)) {
      throw new Error(
        `${specPath}: parameter "${param.name}" declares \`in: ` +
          `${param.in}\`, which is not a valid OpenAPI parameter ` +
          `location. Expected one of: ${PARAMETER_LOCATIONS.join(', ')}.`
      );
    }

    return { resolveSchema, value: param };
  };

  return { resolveParam, resolveSchema };
};

/** Every spec document a run touches, parsed once, with its resolvers. */
export interface SpecIndex {
  specFor: (specPath: string) => CliOpenApiSpec;
  resolversFor: (specPath: string) => SpecResolvers;
}

/**
 * Parses each document once and keeps its resolvers. A shared components file
 * several specs point into is therefore read once, and the schema two of them
 * resolve is the same object — which is what lets a union that refers back to
 * itself be recognised however it was reached.
 */
export const createSpecIndex = (): SpecIndex => {
  const specs = new Map<string, CliOpenApiSpec>();
  const resolvers = new Map<string, SpecResolvers>();

  const specFor = (specPath: string): CliOpenApiSpec => {
    const cached = specs.get(specPath);
    if (cached) return cached;

    const spec = load(fs.readFileSync(specPath, 'utf8')) as CliOpenApiSpec;
    specs.set(specPath, spec);
    return spec;
  };

  const resolversFor = (specPath: string): SpecResolvers => {
    const cached = resolvers.get(specPath);
    if (cached) return cached;

    const created = createDocumentResolvers({
      resolversFor,
      specFor,
      specPath,
    });
    resolvers.set(specPath, created);
    return created;
  };

  return { resolversFor, specFor };
};
