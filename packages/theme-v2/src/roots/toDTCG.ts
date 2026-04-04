import type { ThemeTokensV2 } from '../Types';
import { flattenAndResolve } from './helpers';
import { DTCG_TYPE_PREFIXES } from './tokenRegistry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single DTCG token node with `$value` and `$type`.
 *
 * Follows the W3C Design Tokens Community Group format:
 * https://design-tokens.github.io/community-group/format/
 */
export interface DTCGToken {
  $value: string | number;
  $type: string;
}

/**
 * A recursive tree where every leaf is a `DTCGToken`.
 */
export type DTCGTokenTree = DTCGToken | { [key: string]: DTCGTokenTree };

/** Mutable intermediate type used while building the DTCG tree. */
interface MutableTree {
  [key: string]: MutableTree | DTCGToken;
}

// ---------------------------------------------------------------------------
// $type inference — derived from shared TOKEN_PATH_REGISTRY
// ---------------------------------------------------------------------------

const inferType = (path: string): string => {
  for (const [prefix, type] of DTCG_TYPE_PREFIXES) {
    if (path.startsWith(prefix)) {
      return type;
    }
  }
  return 'string';
};

// ---------------------------------------------------------------------------
// Tree builder
// ---------------------------------------------------------------------------

/**
 * Set a value at a dot-path in a nested object, creating intermediate
 * objects as needed.
 */
const setNestedValue = (
  root: MutableTree,
  path: string,
  value: DTCGToken
): void => {
  const segments = path.split('.');
  let current: MutableTree = root;

  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (!(seg in current) || typeof current[seg] !== 'object') {
      current[seg] = {};
    }
    current = current[seg] as MutableTree;
  }

  current[segments[segments.length - 1]] = value;
};

// ---------------------------------------------------------------------------
// toDTCG
// ---------------------------------------------------------------------------

/**
 * Root 3 — W3C Design Tokens (DTCG JSON).
 *
 * Convert a `ThemeTokensV2` into a structured token tree following the
 * W3C Design Tokens Community Group format. Every leaf node has `$value`
 * (fully resolved) and `$type` (inferred from the token path).
 *
 * This is the interchange format for design tools (Tokens Studio, Figma,
 * Style Dictionary, Specify, Supernova) and CI/CD token pipelines.
 *
 * @example
 * ```ts
 * import { toDTCG } from '@ttoss/theme2/dtcg';
 * import { createTheme } from '@ttoss/theme2';
 *
 * const myBundle = createTheme();
 * const tokens = toDTCG(myBundle.base);
 * // tokens.core.colors.brand['500'] === { $value: '#0469E3', $type: 'color' }
 *
 * // Write to file (build script / token pipeline)
 * await fs.writeFile('tokens.json', JSON.stringify(tokens, null, 2));
 * ```
 */
export const toDTCG = (theme: ThemeTokensV2): DTCGTokenTree => {
  const flat = flattenAndResolve(theme);
  const tree: MutableTree = {};

  for (const [path, value] of Object.entries(flat)) {
    setNestedValue(tree, path, {
      $value: value,
      $type: inferType(path),
    });
  }

  return tree;
};
