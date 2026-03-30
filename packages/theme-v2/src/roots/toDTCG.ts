import type { ThemeTokensV2 } from '../Types';
import { flattenAndResolve } from './helpers';

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

// ---------------------------------------------------------------------------
// $type inference
//
// Maps token path prefixes to DTCG $type values.
// Order matters: longer (more specific) prefixes first.
// ---------------------------------------------------------------------------

const TYPE_PREFIXES: [string, string][] = [
  // Core dataviz (longer/more-specific entries first)
  ['core.dataviz.color.', 'color'],
  ['core.dataviz.opacity.', 'number'],
  ['core.dataviz.', 'string'], // shape, pattern, stroke
  // Semantic dataviz (longer/more-specific entries first)
  ['semantic.dataviz.color.', 'color'],
  ['semantic.dataviz.encoding.opacity.', 'number'],
  ['semantic.dataviz.geo.', 'color'],
  ['semantic.dataviz.encoding.', 'string'], // shape, pattern, stroke
  // Core
  ['core.colors.', 'color'],
  ['core.elevation.dark.', 'shadow'],
  ['core.elevation.level.', 'shadow'],
  ['core.font.family.', 'fontFamily'],
  ['core.font.weight.', 'fontWeight'],
  ['core.font.leading.', 'number'],
  ['core.font.tracking.', 'dimension'],
  ['core.font.opticalSizing.', 'string'],
  ['core.font.numeric.', 'string'],
  ['core.type.ramp.', 'dimension'],
  ['core.space.', 'dimension'],
  ['core.size.', 'dimension'],
  ['core.radii.', 'dimension'],
  ['core.border.width.', 'dimension'],
  ['core.border.style.', 'string'],
  ['core.opacity.', 'number'],
  ['core.motion.duration.', 'duration'],
  ['core.motion.easing.', 'string'],
  ['core.zIndex.level.', 'number'],
  ['core.breakpoint.', 'dimension'],
  // Semantic
  ['semantic.colors.', 'color'],
  ['semantic.elevation.', 'shadow'],
  ['semantic.text.', 'string'],
  ['semantic.spacing.', 'dimension'],
  ['semantic.sizing.', 'dimension'],
  ['semantic.radii.', 'dimension'],
  ['semantic.focus.', 'string'],
  ['semantic.border.', 'string'],
  ['semantic.opacity.', 'number'],
  ['semantic.motion.', 'string'],
  ['semantic.zIndex.layer.', 'number'],
];

const inferType = (path: string): string => {
  for (const [prefix, type] of TYPE_PREFIXES) {
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
  root: Record<string, unknown>,
  path: string,
  value: DTCGToken
): void => {
  const segments = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = root;

  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (!(seg in current) || typeof current[seg] !== 'object') {
      current[seg] = {};
    }
    current = current[seg];
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
 * import { themes, toDTCG } from '@ttoss/theme2';
 *
 * const tokens = toDTCG(themes.default);
 * // tokens.core.colors.brand['500'] === { $value: '#0469E3', $type: 'color' }
 * ```
 */
export const toDTCG = (theme: ThemeTokensV2): DTCGTokenTree => {
  const flat = flattenAndResolve(theme);
  const tree: Record<string, unknown> = {};

  for (const [path, value] of Object.entries(flat)) {
    setNestedValue(tree, path, {
      $value: value,
      $type: inferType(path),
    });
  }

  return tree as DTCGTokenTree;
};
