import type { OpenApiSpec } from './types';

/**
 * Keys whose value maps names to entries: a schema named `items`, or a
 * property named `items`, is a name there, never the keyword.
 */
const NAME_MAPS = new Set([
  'callbacks',
  'content',
  'encoding',
  'headers',
  'links',
  'parameters',
  'paths',
  'properties',
  'requestBodies',
  'responses',
  'schemas',
  'securitySchemes',
]);

/** Keys whose value is data rather than schema: an example may hold `items`. */
const DATA_KEYS = new Set(['default', 'enum', 'example', 'examples']);

const declaresArray = (node: Record<string, unknown>): boolean => {
  return Array.isArray(node.type)
    ? node.type.includes('array')
    : node.type === 'array';
};

type Visit = { node: object; isNameMap: boolean };

/** `items` on a schema, as opposed to a name or an array element. */
const isUntypedItems = ({ node, isNameMap }: Visit): boolean => {
  if (isNameMap || Array.isArray(node) || !('items' in node)) return false;
  return !declaresArray(node as Record<string, unknown>);
};

const isData = (args: Visit & { key: string }): boolean => {
  if (args.isNameMap) return false;
  return DATA_KEYS.has(args.key) || args.key.startsWith('x-');
};

const opensNameMap = (args: Visit & { key: string }): boolean => {
  return (
    !args.isNameMap && !Array.isArray(args.node) && NAME_MAPS.has(args.key)
  );
};

const collectUntypedItems = (args: {
  node: unknown;
  at: string;
  isNameMap: boolean;
  offenders: string[];
}) => {
  const { node, at, isNameMap, offenders } = args;
  if (typeof node !== 'object' || node === null) return;

  if (isUntypedItems({ node, isNameMap })) offenders.push(at);

  for (const [key, child] of Object.entries(node)) {
    if (isData({ node, isNameMap, key })) continue;
    collectUntypedItems({
      node: child,
      at: at ? `${at}.${key}` : key,
      isNameMap: opensNameMap({ node, isNameMap, key }),
      offenders,
    });
  }
};

/**
 * Refuses a schema with `items` but no `type: array`. OpenAPI applies `items`
 * only to an array, so generators type such a field `unknown` instead of
 * failing — the loss is silent, which is why it is refused here.
 */
export const assertTypedArrays = (args: {
  spec: OpenApiSpec;
  specPath: string;
}) => {
  const offenders: string[] = [];
  collectUntypedItems({ node: args.spec, at: '', isNameMap: false, offenders });

  if (offenders.length > 0) {
    throw new Error(
      `${args.specPath}: \`items\` without \`type: array\` at\n` +
        offenders
          .map((at) => {
            return `  ${at}`;
          })
          .join('\n')
    );
  }
};
