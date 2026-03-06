import type { ThemeTokensV2 } from '../ThemeTokensTemplate';

// ---------------------------------------------------------------------------
// Token reference utilities
// ---------------------------------------------------------------------------

/** Check if a value is a token reference like `{core.colors.brand.main}` */
export const isTokenRef = (value: unknown): value is string => {
  return (
    typeof value === 'string' &&
    value.length > 2 &&
    value.startsWith('{') &&
    value.endsWith('}')
  );
};

/** Extract the inner path from a token reference: `{core.colors.brand.main}` → `core.colors.brand.main` */
export const extractRefPath = (ref: string): string => {
  return ref.slice(1, -1);
};

// ---------------------------------------------------------------------------
// Chakra reference mapping
//
// Maps our internal token paths to Chakra v3 token namespace paths.
// Order matters: longer (more specific) prefixes must come first.
// ---------------------------------------------------------------------------

const CHAKRA_REF_PREFIXES: [string, string][] = [
  // Core paths → Chakra token namespaces
  ['core.colors.', 'colors.'],
  ['core.elevation.level.', 'shadows.'],
  ['core.font.family.', 'fonts.'],
  ['core.font.weight.', 'fontWeights.'],
  ['core.font.leading.', 'lineHeights.'],
  ['core.font.tracking.', 'letterSpacings.'],
  ['core.font.opticalSizing.', 'fontOpticalSizing.'],
  ['core.font.numeric.', 'fontVariantNumeric.'],
  ['core.type.ramp.', 'fontSizes.'],
  ['core.space.', 'spacing.'],
  ['core.size.', 'sizes.'],
  ['core.radii.', 'radii.'],
  ['core.borders.width.', 'borderWidths.'],
  ['core.borders.style.', 'borderStyles.'],
  ['core.opacity.', 'opacity.'],
  ['core.motion.duration.', 'durations.'],
  ['core.motion.easing.', 'easings.'],
  ['core.zIndex.', 'zIndex.'],
  ['core.breakpoints.', 'breakpoints.'],
  // Semantic self-references → Chakra semantic namespaces
  ['semantic.colors.', 'colors.'],
  ['semantic.elevation.', 'shadows.'],
  ['semantic.spacing.', 'spacing.'],
  ['semantic.sizing.', 'sizes.'],
  ['semantic.radii.', 'radii.'],
  ['semantic.border.', 'borders.'],
  ['semantic.opacity.', 'opacity.'],
  ['semantic.motion.', 'motion.'],
  ['semantic.zIndex.', 'zIndex.'],
];

/**
 * Transform a ttoss token reference to a Chakra token reference.
 *
 * `{core.colors.brand.accent}` → `{colors.brand.accent}`
 * `{core.font.family.sans}`    → `{fonts.sans}`
 * `{semantic.spacing.gap.stack.xs}` → `{spacing.gap.stack.xs}`
 */
export const toChakraRef = (ref: string): string => {
  const inner = extractRefPath(ref);
  for (const [prefix, chakraPrefix] of CHAKRA_REF_PREFIXES) {
    if (inner.startsWith(prefix)) {
      return `{${chakraPrefix}${inner.slice(prefix.length)}}`;
    }
  }
  return ref;
};

// ---------------------------------------------------------------------------
// Tailwind CSS variable mapping
//
// Maps our internal token paths to CSS custom property names with `--tt-` prefix.
// ---------------------------------------------------------------------------

const TAILWIND_CSS_PREFIXES: [string, string][] = [
  // Core paths → CSS var namespaces
  ['core.colors.', '--tt-color-'],
  ['core.elevation.level.', '--tt-shadow-'],
  ['core.font.family.', '--tt-font-'],
  ['core.font.weight.', '--tt-font-weight-'],
  ['core.font.leading.', '--tt-line-height-'],
  ['core.font.tracking.', '--tt-letter-spacing-'],
  ['core.font.opticalSizing.', '--tt-font-optical-sizing-'],
  ['core.font.numeric.', '--tt-font-variant-numeric-'],
  ['core.type.ramp.', '--tt-font-size-'],
  ['core.space.', '--tt-space-'],
  ['core.size.', '--tt-size-'],
  ['core.radii.', '--tt-radii-'],
  ['core.borders.width.', '--tt-border-width-'],
  ['core.borders.style.', '--tt-border-style-'],
  ['core.opacity.', '--tt-opacity-'],
  ['core.motion.duration.', '--tt-duration-'],
  ['core.motion.easing.', '--tt-easing-'],
  ['core.zIndex.', '--tt-z-index-'],
  ['core.breakpoints.', '--tt-breakpoint-'],
  // Semantic paths → CSS var namespaces
  ['semantic.colors.', '--tt-'],
  ['semantic.elevation.', '--tt-elevation-'],
  ['semantic.text.', '--tt-text-'],
  ['semantic.spacing.', '--tt-spacing-'],
  ['semantic.sizing.', '--tt-sizing-'],
  ['semantic.radii.', '--tt-radii-semantic-'],
  ['semantic.border.', '--tt-border-'],
  ['semantic.opacity.', '--tt-opacity-semantic-'],
  ['semantic.motion.', '--tt-motion-'],
  ['semantic.zIndex.', '--tt-z-index-semantic-'],
];

/**
 * Convert a full token path to a CSS custom property name.
 *
 * `core.colors.brand.main` → `--tt-color-brand-main`
 * `semantic.colors.action.primary.background.default` → `--tt-action-primary-background-default`
 */
export const toCssVarName = (tokenPath: string): string => {
  for (const [prefix, cssPrefix] of TAILWIND_CSS_PREFIXES) {
    if (tokenPath.startsWith(prefix)) {
      const rest = tokenPath.slice(prefix.length).replace(/\./g, '-');
      return `${cssPrefix}${rest}`;
    }
  }
  return `--tt-${tokenPath.replace(/\./g, '-')}`;
};

/**
 * Transform a ttoss token reference to a CSS `var()` reference.
 *
 * `{core.colors.brand.accent}` → `var(--tt-color-brand-accent)`
 */
export const toCssVarRef = (ref: string): string => {
  const inner = extractRefPath(ref);
  const varName = toCssVarName(inner);
  return `var(${varName})`;
};

// ---------------------------------------------------------------------------
// Object traversal utilities
// ---------------------------------------------------------------------------

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * Flatten a nested object into a flat record with dot-separated keys.
 *
 * `{ brand: { main: '#292C2a' } }` → `{ 'brand.main': '#292C2a' }`
 */
export const flattenObject = (
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, string | number> => {
  const result: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else if (typeof value === 'string' || typeof value === 'number') {
      result[fullKey] = value;
    }
  }

  return result;
};

/**
 * Wrap every leaf value of a nested object in `{ value: leaf }` for Chakra tokens.
 */
export const wrapValues = (
  obj: Record<string, unknown>
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isPlainObject(value)) {
      result[key] = wrapValues(value);
    } else {
      result[key] = { value };
    }
  }

  return result;
};

/**
 * Wrap every leaf value and transform token references for Chakra semantic tokens.
 */
export const wrapAndTransformRefs = (
  obj: Record<string, unknown>
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isPlainObject(value)) {
      result[key] = wrapAndTransformRefs(value);
    } else if (isTokenRef(value)) {
      result[key] = { value: toChakraRef(value) };
    } else {
      result[key] = { value };
    }
  }

  return result;
};

// ---------------------------------------------------------------------------
// Build a lookup map from full token paths to CSS var names
// Used by the Tailwind adapter to resolve references in semantic tokens.
// ---------------------------------------------------------------------------

/**
 * Build a flat CSS custom properties record from a ThemeTokensV2.
 *
 * Core tokens get raw values. Semantic tokens get `var()` references.
 */
export const buildCssVars = (
  theme: ThemeTokensV2
): Record<string, string | number> => {
  const vars: Record<string, string | number> = {};

  // Flatten core tokens
  const coreFlat = flattenObject(
    theme.core as unknown as Record<string, unknown>,
    'core'
  );
  for (const [path, value] of Object.entries(coreFlat)) {
    vars[toCssVarName(path)] = value;
  }

  // Flatten semantic tokens, resolving refs to var() references
  const semanticFlat = flattenObject(
    theme.semantic as unknown as Record<string, unknown>,
    'semantic'
  );
  for (const [path, value] of Object.entries(semanticFlat)) {
    const varName = toCssVarName(path);
    if (typeof value === 'string' && isTokenRef(value)) {
      vars[varName] = toCssVarRef(value);
    } else {
      vars[varName] = value;
    }
  }

  return vars;
};
