import type { ThemeTokens } from '../Types';
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

/**
 * Suffix-level overrides applied after prefix lookup.
 *
 * The token registry uses a single prefix per semantic subtree (e.g.
 * `semantic.motion.`, `semantic.text.`) which cannot express per-property
 * DTCG types for composite token shapes (TextStyle, SemanticMotionEntry).
 * These overrides catch every case where the leaf property name alone
 * carries the required type — regardless of the token family it belongs to.
 *
 * Rule: a suffix override takes precedence over the prefix-based $type.
 *
 * Typography leaves (TextStyle) that need non-string $types:
 * - `.fontFamily`   → 'fontFamily'  (DTCG named type for font stacks)
 * - `.fontSize`     → 'dimension'   (clamp() / px value)
 * - `.fontWeight`   → 'fontWeight'  (numeric weight: 400, 500, 700 …)
 * - `.lineHeight`   → 'number'      (unitless multiplier: 1.15, 1.5 …)
 * - `.letterSpacing` → 'dimension'  (em value: '-0.02em', '0.04em' …)
 *
 * Motion leaves (SemanticMotionEntry) overridden separately:
 * - `.duration`     → 'duration'
 */
const SUFFIX_TYPE_OVERRIDES: ReadonlyArray<[suffix: string, dtcgType: string]> =
  [
    ['.duration', 'duration'],
    ['.fontFamily', 'fontFamily'],
    ['.fontSize', 'dimension'],
    ['.fontWeight', 'fontWeight'],
    ['.lineHeight', 'number'],
    ['.letterSpacing', 'dimension'],
    // focus.ring.color is a color token — must not fall through to the 'string'
    // default from the semantic.focus. prefix entry.
    ['.ring.color', 'color'],
  ];

const inferType = (path: string): string => {
  for (const [suffix, type] of SUFFIX_TYPE_OVERRIDES) {
    if (path.endsWith(suffix)) {
      return type;
    }
  }
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
 * Convert a `ThemeTokens` into a structured token tree following the
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
export const toDTCG = (theme: ThemeTokens): DTCGTokenTree => {
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
