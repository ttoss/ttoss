/**
 * Token Resolution Map — Runtime-queryable mapping from Component Model
 * dimensions (Responsibility, Host.Role) to CSS custom property patterns.
 *
 * This is the bridge between the semantic Component Model and the
 * concrete --tt-* CSS custom properties from @ttoss/theme2.
 *
 * All TokenSpec fields are typed unions derived from ThemeTokensV2, making
 * any invalid value a compile-time error — not a runtime failure or a
 * linting convention.
 *
 * Consumed by:
 *   - Component CSS authors (reference for which --tt-* vars to use)
 *   - Contract tests (validate CSS uses correct token namespaces)
 *   - AI/Copilot (programmatic lookup when creating new components)
 *   - Applications (query token dependencies for targeted overrides)
 *
 * @example
 * ```ts
 * import { resolveTokens, colorVar } from '@ttoss/ui2';
 *
 * // What tokens does a standalone Action use?
 * resolveTokens({ responsibility: 'Action' });
 * // → { color: 'action.primary', textStyle: 'label.md', spacing: 'inset.control', ... }
 *
 * // What CSS var is the background?
 * colorVar('action.primary', 'background');
 * // → '--tt-action-primary-background-default'
 *
 * // Button as secondary action in a dialog footer?
 * resolveTokens({ responsibility: 'Action', host: 'ActionSet', role: 'secondary' });
 * // → { color: 'action.secondary', textStyle: 'label.md', ... }
 * ```
 */

import type { ThemeTokensV2 } from '@ttoss/theme2';

import type { Host } from './composition';
import type { Responsibility } from './index';

/* ------------------------------------------------------------------ */
/*  Utility — pairwise '{parent}.{child}' path builder                */
/* ------------------------------------------------------------------ */

/**
 * Derives all '{K}.{R}' string literal pairs from a two-level nested type.
 * Used to derive token identifier unions from ThemeTokensV2 semantic layers.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PairwisePaths<T extends Record<string, any>> = {
  [K in keyof T & string]: {
    [R in keyof NonNullable<T[K]> & string]: `${K}.${R}`;
  }[keyof NonNullable<T[K]> & string];
}[keyof T & string];

/* ------------------------------------------------------------------ */
/*  Token identifier types — derived from ThemeTokensV2               */
/* ------------------------------------------------------------------ */

/**
 * All valid '{ux}.{role}' color prefixes.
 * Maps to CSS vars: --tt-{prefix}-{background|text|border}-{state}
 *
 * @example 'action.primary' | 'input.muted' | 'feedback.negative' | ...
 */
export type ColorPrefix = PairwisePaths<ThemeTokensV2['semantic']['colors']>;

/**
 * All valid '{family}.{size}' text style keys.
 * Maps to CSS vars via textStyleVars().
 *
 * @example 'label.md' | 'body.sm' | 'display.lg' | ...
 */
export type TextStyleKey = PairwisePaths<ThemeTokensV2['semantic']['text']>;

/**
 * All valid '{context}.{speed}' motion patterns.
 * Maps to CSS vars via motionVar().
 *
 * @example 'feedback.fast' | 'navigation.standard' | 'decorative.slow'
 */
export type MotionPattern = PairwisePaths<ThemeTokensV2['semantic']['motion']>;

/**
 * All valid elevation alias keys.
 * Maps to --tt-elevation-{alias}.
 */
export type ElevationAlias = keyof ThemeTokensV2['semantic']['elevation'];

/**
 * All valid radii alias keys.
 * Maps to --tt-radii-semantic-{alias}.
 */
export type RadiiAlias = keyof ThemeTokensV2['semantic']['radii'];

/**
 * All valid z-index alias keys.
 * Maps to --tt-z-index-semantic-{alias}.
 */
export type ZIndexAlias = keyof ThemeTokensV2['semantic']['zIndex'];

/**
 * Valid spacing pattern prefixes passed to spacingVar(pattern, step).
 * Each pattern identifies a step-keyed object in semantic.spacing.
 * Manually maintained to match semantic.spacing in ThemeTokensV2.
 */
export type SpacingPattern =
  | 'inset.control'
  | 'inset.surface'
  | 'gap.stack'
  | 'gap.inline'
  | 'gutter.page'
  | 'gutter.section'
  | 'separation.interactive.min';

/**
 * Valid sizing leaf paths passed to sizingVar().
 * Manually maintained to match semantic.sizing in ThemeTokensV2.
 */
export type SizingKey =
  | 'hit.min'
  | 'hit.default'
  | 'hit.prominent'
  | 'icon.sm'
  | 'icon.md'
  | 'icon.lg'
  | 'identity.sm'
  | 'identity.md'
  | 'identity.lg'
  | 'identity.xl'
  | 'measure.reading'
  | 'surface.maxWidth'
  | 'viewport.height.full';

/* ------------------------------------------------------------------ */
/*  TokenSpec                                                          */
/* ------------------------------------------------------------------ */

/**
 * Describes which semantic token paths a component part should consume.
 *
 * All fields are typed unions derived from ThemeTokensV2. Any value not
 * present in the theme contract is a TypeScript compile-time error.
 *
 * | Field     | CSS var pattern                                      |
 * |-----------|------------------------------------------------------|
 * | color     | `--tt-{color}-{background|text|border}-{state}`      |
 * | textStyle | `--tt-text-{textStyle}-{property}`                   |
 * | spacing   | `--tt-spacing-{spacing}-{step}`                      |
 * | sizing    | `--tt-sizing-{sizing}`                               |
 * | radii     | `--tt-radii-semantic-{radii}`                        |
 * | elevation | `--tt-elevation-{elevation}`                         |
 * | motion    | `--tt-motion-{motion}-{duration|easing}`              |
 * | zIndex    | `--tt-z-index-semantic-{zIndex}`                     |
 */
export interface TokenSpec {
  /** Color semantic prefix → --tt-{prefix}-{background|text|border}-{state} */
  color?: ColorPrefix;
  /** Text style key → --tt-text-{key}-{fontFamily|fontSize|fontWeight|lineHeight|letterSpacing} */
  textStyle?: TextStyleKey;
  /** Spacing pattern → --tt-spacing-{pattern}-{step} */
  spacing?: SpacingPattern;
  /** Sizing key → --tt-sizing-{key} */
  sizing?: SizingKey;
  /** Radii alias → --tt-radii-semantic-{alias} */
  radii?: RadiiAlias;
  /** Elevation alias → --tt-elevation-{alias} */
  elevation?: ElevationAlias;
  /** Motion pattern → --tt-motion-{pattern}-{duration|easing} */
  motion?: MotionPattern;
  /** Z-index alias → --tt-z-index-semantic-{alias} */
  zIndex?: ZIndexAlias;
}

/* ------------------------------------------------------------------ */
/*  Responsibility defaults (standalone resolution)                    */
/* ------------------------------------------------------------------ */

/**
 * Default token resolution for each Responsibility.
 * Used when a component is standalone (no Host.Role context).
 */
export const responsibilityDefaults: Record<Responsibility, TokenSpec> = {
  Action: {
    color: 'action.primary',
    textStyle: 'label.md',
    spacing: 'inset.control',
    sizing: 'hit.default',
    radii: 'control',
    motion: 'feedback.fast',
  },
  Input: {
    color: 'input.primary',
    textStyle: 'body.md',
    spacing: 'inset.control',
    sizing: 'hit.default',
    radii: 'control',
    motion: 'feedback.fast',
  },
  Selection: {
    color: 'input.primary',
    textStyle: 'label.md',
    spacing: 'inset.control',
    motion: 'feedback.fast',
  },
  Collection: {
    color: 'content.primary',
    textStyle: 'body.md',
    spacing: 'inset.surface',
  },
  Navigation: {
    color: 'navigation.primary',
    textStyle: 'label.md',
    spacing: 'inset.control',
    zIndex: 'navigation',
    motion: 'navigation.standard',
  },
  Disclosure: {
    color: 'content.primary',
    textStyle: 'body.md',
    spacing: 'inset.control',
    motion: 'navigation.standard',
  },
  Overlay: {
    color: 'content.primary',
    textStyle: 'body.md',
    spacing: 'inset.surface',
    elevation: 'modal',
    radii: 'surface',
    zIndex: 'modal',
    motion: 'navigation.standard',
  },
  Feedback: {
    color: 'feedback.primary',
    textStyle: 'body.md',
    spacing: 'inset.surface',
    radii: 'surface',
    motion: 'feedback.fast',
  },
  Structure: {
    color: 'content.primary',
    textStyle: 'body.md',
    spacing: 'inset.surface',
  },
};

/* ------------------------------------------------------------------ */
/*  Composition tokens (Host.Role overrides)                           */
/* ------------------------------------------------------------------ */

/**
 * Token overrides for compositional contexts.
 * When a component part plays a Role inside a Host, these values
 * refine (override) the Responsibility defaults.
 */
export const compositionTokens: Record<string, TokenSpec> = {
  // ActionSet
  'ActionSet.primary': { color: 'action.primary' },
  'ActionSet.secondary': { color: 'action.secondary' },
  'ActionSet.dismiss': { color: 'action.muted' },

  // FieldFrame
  'FieldFrame.control': {
    color: 'input.primary',
    textStyle: 'body.md',
    spacing: 'inset.control',
    radii: 'control',
  },
  'FieldFrame.label': { color: 'content.primary', textStyle: 'label.md' },
  'FieldFrame.description': { color: 'content.muted', textStyle: 'body.sm' },
  'FieldFrame.leadingAdornment': { color: 'content.muted', sizing: 'icon.md' },
  'FieldFrame.trailingAdornment': {
    color: 'content.muted',
    sizing: 'icon.md',
  },
  'FieldFrame.validationMessage': {
    color: 'feedback.negative',
    textStyle: 'body.sm',
  },

  // ItemFrame
  'ItemFrame.label': { color: 'navigation.primary', textStyle: 'label.md' },
  'ItemFrame.description': { color: 'content.muted', textStyle: 'body.sm' },
  'ItemFrame.supportingVisual': { color: 'content.muted', sizing: 'icon.md' },
  'ItemFrame.trailingMeta': { color: 'content.muted', textStyle: 'body.sm' },
  'ItemFrame.selectionControl': { color: 'input.primary' },

  // SurfaceFrame
  'SurfaceFrame.heading': { color: 'content.primary', textStyle: 'title.md' },
  'SurfaceFrame.body': {
    color: 'content.primary',
    textStyle: 'body.md',
    spacing: 'gap.stack',
  },
  'SurfaceFrame.actions': { spacing: 'separation.interactive.min' },
  'SurfaceFrame.status': { color: 'feedback.primary' },
  'SurfaceFrame.media': {},
};

/* ------------------------------------------------------------------ */
/*  Resolution function                                                */
/* ------------------------------------------------------------------ */

/**
 * Resolve the token spec for a given Responsibility and optional Host.Role.
 *
 * When Host.Role is provided, composition overrides are merged on top of
 * the Responsibility defaults. Only defined fields in the override replace
 * the defaults — undefined fields are preserved.
 *
 * @example
 * ```ts
 * // Standalone button
 * resolveTokens({ responsibility: 'Action' });
 * // → { color: 'action.primary', textStyle: 'label.md', ... }
 *
 * // Button as secondary action in a dialog footer
 * resolveTokens({ responsibility: 'Action', host: 'ActionSet', role: 'secondary' });
 * // → { color: 'action.secondary', textStyle: 'label.md', ... }
 *
 * // Field label
 * resolveTokens({ responsibility: 'Structure', host: 'FieldFrame', role: 'label' });
 * // → { color: 'content.primary', textStyle: 'label.md', ... }
 * ```
 */
export const resolveTokens = ({
  responsibility,
  host,
  role,
}: {
  responsibility: Responsibility;
  host?: Host;
  role?: string;
}): TokenSpec => {
  const base = { ...responsibilityDefaults[responsibility] };

  if (host && role) {
    const key = `${host}.${role}`;
    const override = compositionTokens[key];
    if (override) {
      for (const [k, v] of Object.entries(override)) {
        if (v !== undefined) {
          (base as Record<string, unknown>)[k] = v;
        }
      }
    }
  }

  return base;
};

/* ------------------------------------------------------------------ */
/*  CSS custom property name utilities                                 */
/* ------------------------------------------------------------------ */

type ColorDimension = 'background' | 'text' | 'border';

/**
 * Build a CSS custom property name for a semantic color token.
 *
 * @example
 * colorVar('action.primary', 'background')          // '--tt-action-primary-background-default'
 * colorVar('action.primary', 'background', 'hover') // '--tt-action-primary-background-hover'
 * colorVar('feedback.negative', 'text')              // '--tt-feedback-negative-text-default'
 */
export const colorVar = (
  prefix: ColorPrefix,
  dimension: ColorDimension,
  state: string = 'default'
): string => {
  return `--tt-${prefix.replace(/\./g, '-')}-${dimension}-${state}`;
};

/**
 * Build CSS custom property names for a semantic text style.
 *
 * @example
 * textStyleVars('label.md')
 * // → { fontFamily: '--tt-text-label-md-fontFamily', fontSize: '--tt-text-label-md-fontSize', ... }
 */
export const textStyleVars = (key: TextStyleKey) => {
  const base = `--tt-text-${key.replace(/\./g, '-')}`;
  return {
    fontFamily: `${base}-fontFamily`,
    fontSize: `${base}-fontSize`,
    fontWeight: `${base}-fontWeight`,
    lineHeight: `${base}-lineHeight`,
    letterSpacing: `${base}-letterSpacing`,
  } as const;
};

/**
 * Build a CSS custom property name for a spacing token.
 *
 * @example
 * spacingVar('inset.control', 'md') // '--tt-spacing-inset-control-md'
 * spacingVar('gap.stack', 'sm')     // '--tt-spacing-gap-stack-sm'
 */
export const spacingVar = (pattern: SpacingPattern, step: string): string => {
  return `--tt-spacing-${pattern.replace(/\./g, '-')}-${step}`;
};

/**
 * Build a CSS custom property name for a semantic radii token.
 *
 * @example
 * radiiVar('control') // '--tt-radii-semantic-control'
 * radiiVar('surface') // '--tt-radii-semantic-surface'
 */
export const radiiVar = (alias: RadiiAlias): string => {
  return `--tt-radii-semantic-${alias}`;
};

/**
 * Build a CSS custom property name for an elevation token.
 *
 * @example
 * elevationVar('modal')   // '--tt-elevation-modal'
 * elevationVar('overlay') // '--tt-elevation-overlay'
 */
export const elevationVar = (alias: ElevationAlias): string => {
  return `--tt-elevation-${alias}`;
};

/**
 * Build a CSS custom property name for a sizing token.
 *
 * @example
 * sizingVar('hit.default') // '--tt-sizing-hit-default'
 * sizingVar('icon.md')     // '--tt-sizing-icon-md'
 */
export const sizingVar = (key: SizingKey): string => {
  return `--tt-sizing-${key.replace(/\./g, '-')}`;
};

/**
 * Build CSS custom property names for a motion pattern.
 *
 * @example
 * motionVar('feedback.fast')
 * // → { duration: '--tt-motion-feedback-fast-duration', easing: '--tt-motion-feedback-fast-easing' }
 */
export const motionVar = (pattern: MotionPattern) => {
  const base = `--tt-motion-${pattern.replace(/\./g, '-')}`;
  return {
    duration: `${base}-duration`,
    easing: `${base}-easing`,
  } as const;
};

/**
 * Build a CSS custom property name for a z-index token.
 *
 * @example
 * zIndexVar('modal')      // '--tt-z-index-semantic-modal'
 * zIndexVar('navigation') // '--tt-z-index-semantic-navigation'
 */
export const zIndexVar = (alias: ZIndexAlias): string => {
  return `--tt-z-index-semantic-${alias}`;
};

/**
 * Build a CSS custom property name for an opacity token.
 *
 * @example
 * opacityVar('disabled') // '--tt-opacity-disabled'
 * opacityVar('hover')    // '--tt-opacity-hover'
 */
export const opacityVar = (alias: string): string => {
  return `--tt-opacity-${alias}`;
};
