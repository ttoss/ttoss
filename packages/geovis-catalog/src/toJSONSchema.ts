import { z } from 'zod';

const DEFS_PREFIX = '#/$defs/';

type JSONSchemaDocument = Record<string, unknown> & {
  $ref?: string;
  $defs?: Record<string, unknown>;
};

/**
 * `z.toJSONSchema` at draft 2020-12, with the root schema kept inline.
 *
 * Since Zod 4.6, a root carrying `.meta({ id })` is moved into `$defs` and the
 * document root becomes a bare `$ref`. That breaks both consumers of these
 * documents: an LLM tool `input_schema` must be `type: 'object'` at the root,
 * and a root `$id` moved under `$defs` re-bases every nested `#/$defs/...`
 * reference onto a resource that has no `$defs`. Inlining the root restores
 * the document shape Zod produced before.
 */
export const toJSONSchema = (schema: z.ZodType): Record<string, unknown> => {
  const jsonSchema = z.toJSONSchema(schema, {
    target: 'draft-2020-12',
  }) as JSONSchemaDocument;

  const { $ref, $defs = {}, ...document } = jsonSchema;
  if (!$ref?.startsWith(DEFS_PREFIX)) {
    return jsonSchema;
  }

  const rootId = $ref
    .slice(DEFS_PREFIX.length)
    .replace(/~1/g, '/')
    .replace(/~0/g, '~');
  const { [rootId]: root, ...otherDefs } = $defs;
  // A recursive root keeps its `$defs` entry for its inner references.
  const defs = JSON.stringify($defs).includes(JSON.stringify($ref))
    ? $defs
    : otherDefs;

  return {
    ...document,
    ...(root as Record<string, unknown>),
    ...(Object.keys(defs).length > 0 ? { $defs: defs } : {}),
  };
};
