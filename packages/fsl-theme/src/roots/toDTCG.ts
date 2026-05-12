import type { ThemeTokens } from '../Types';
import { toFlatTokens } from './helpers';
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
  $extensions?: Record<string, unknown>;
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
// Coarse-pointer extensions — declares the hit.fine/hit.coarse coupling
// ---------------------------------------------------------------------------

/** Semantic hit token prefix that carries coarse-pointer overrides. */
const SEMANTIC_HIT_PREFIX = 'semantic.sizing.hit.';

/**
 * Build the `$extensions` metadata for a semantic hit token.
 *
 * Each `semantic.sizing.hit.{step}` token defaults to the fine-pointer value.
 * The extension declares the corresponding coarse-pointer raw value so that
 * non-CSS consumers (React Native, design tool pipelines) can locate and
 * apply touch-target overrides without reading `toCssVars` source code.
 */
const buildHitExtension = (
  step: string,
  theme: ThemeTokens
): Record<string, unknown> | undefined => {
  const coarseValue = (
    theme.core.sizing.hit.coarse as unknown as Record<string, unknown>
  )[step];
  if (coarseValue === undefined) return undefined;

  return {
    'com.ttoss.pointer-override': {
      condition: 'any-pointer: coarse',
      value: coarseValue,
    },
  };
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
 * Semantic hit tokens (`semantic.sizing.hit.*`) include a `$extensions`
 * field declaring their coarse-pointer override value, so non-CSS consumers
 * can apply touch-target ergonomics without reading the CSS emitter source.
 *
 * This is the interchange format for design tools (Tokens Studio, Figma,
 * Style Dictionary, Specify, Supernova) and CI/CD token pipelines.
 *
 * @example
 * ```ts
 * import { toDTCG } from '@ttoss/fsl-theme/dtcg';
 * import { createTheme } from '@ttoss/fsl-theme';
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
  const flat = toFlatTokens(theme);
  const tree: MutableTree = {};

  for (const [path, value] of Object.entries(flat)) {
    const token: DTCGToken = {
      $value: value,
      $type: inferType(path),
    };

    if (path.startsWith(SEMANTIC_HIT_PREFIX)) {
      const step = path.slice(SEMANTIC_HIT_PREFIX.length);
      const ext = buildHitExtension(step, theme);
      if (ext) {
        token.$extensions = ext;
      }
    }

    setNestedValue(tree, path, token);
  }

  return tree;
};
