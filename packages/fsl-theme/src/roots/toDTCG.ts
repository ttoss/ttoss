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
  /**
   * W3C DTCG type. **Optional** — omitted for opaque/keyword tokens that have
   * no valid DTCG scalar type (`$type` is optional in the DTCG spec). There is
   * no `'string'` DTCG type; emitting one would break conformant importers.
   */
  $type?: string;
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
 *
 * Border / focus line widths resolve to a `dimension` (`1px`, `2px`) but sit
 * under the untyped `semantic.border.` / `semantic.focus.` prefixes:
 * - `.width`        → 'dimension'
 */
const SUFFIX_TYPE_OVERRIDES: ReadonlyArray<[suffix: string, dtcgType: string]> =
  [
    ['.duration', 'duration'],
    ['.fontFamily', 'fontFamily'],
    ['.fontSize', 'dimension'],
    ['.fontWeight', 'fontWeight'],
    ['.lineHeight', 'number'],
    ['.letterSpacing', 'dimension'],
    ['.width', 'dimension'],
    // focus.ring.color is a color token — must not fall through to the untyped
    // semantic.focus. prefix entry.
    ['.ring.color', 'color'],
  ];

/**
 * Infer the DTCG `$type` for a token path, or `undefined` when the token is
 * opaque (keyword/curve/dash-string) and has no valid DTCG scalar type — in
 * which case `toDTCG` omits `$type` rather than emitting an invalid one.
 */
const inferDtcgType = (path: string): string | undefined => {
  for (const [suffix, type] of SUFFIX_TYPE_OVERRIDES) {
    if (path.endsWith(suffix)) {
      return type;
    }
  }
  for (const [prefix, type] of DTCG_TYPE_PREFIXES) {
    if (path.startsWith(prefix)) {
      return type; // may be undefined — an opaque entry stops the search
    }
  }
  return undefined;
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

/** Semantic hit token path that carries the coarse-pointer override. */
const SEMANTIC_HIT_PATH = 'semantic.sizing.hit';

/**
 * Build the `$extensions` metadata for the semantic hit token.
 *
 * `semantic.sizing.hit` defaults to the fine-pointer value. The extension
 * declares the coarse-pointer raw value (`core.sizing.hit.coarse`) so that
 * non-CSS consumers (React Native, design tool pipelines) can locate and
 * apply the touch-target override without reading `toCssVars` source code.
 */
const buildHitExtension = (theme: ThemeTokens): Record<string, unknown> => {
  return {
    'com.ttoss.pointer-override': {
      condition: 'any-pointer: coarse',
      value: theme.core.sizing.hit.coarse,
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
 * W3C Design Tokens Community Group format (2025.10). Every leaf has a
 * `$value`; `$type` is inferred from the token path and **omitted** for opaque
 * tokens with no valid DTCG scalar type (`$type` is optional per spec).
 *
 * **Profile:** this emits **fully-resolved scalar tokens** — `$value`s are
 * concrete (no `{alias}` refs) and composite shapes (typography, shadow,
 * border, transition) are emitted as their individual scalar leaves, not as
 * DTCG composite objects. This is a conformant DTCG profile; richer
 * alias-preserving / composite output is a deferred enhancement (see
 * CONTRIBUTING.md ADR-013).
 *
 * The semantic hit token (`semantic.sizing.hit`) includes a `$extensions`
 * field declaring its coarse-pointer override value, so non-CSS consumers
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
    const dtcgType = inferDtcgType(path);
    const token: DTCGToken = { $value: value };
    if (dtcgType !== undefined) {
      token.$type = dtcgType;
    }

    if (path === SEMANTIC_HIT_PATH) {
      token.$extensions = buildHitExtension(theme);
    }

    setNestedValue(tree, path, token);
  }

  return tree;
};
