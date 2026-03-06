import type { ThemeTokensV2 } from '../ThemeTokensTemplate';
import {
  extractRefPath,
  isTokenRef,
  toChakraRef,
  wrapAndTransformRefs,
  wrapValues,
} from './helpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Return type of `toChakraTheme()`.
 *
 * Merges into Chakra UI v3 `createSystem()` as the second argument:
 * ```ts
 * const system = createSystem(defaultConfig, toChakraTheme(theme));
 * ```
 */
export interface ChakraThemeConfig {
  theme: {
    tokens: Record<string, unknown>;
    semanticTokens: Record<string, unknown>;
    textStyles: Record<string, unknown>;
  };
  breakpoints: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Text styles transformer
//
// Converts semantic text styles into Chakra textStyles format:
//   { display: { lg: { value: { fontFamily: '{fonts.sans}', ... } } } }
// ---------------------------------------------------------------------------

// Prefixes that map to Chakra token namespaces that don't exist.
// These refs must be resolved to raw values instead of emitting Chakra refs.
const INLINE_RESOLVE_PREFIXES = [
  'core.font.opticalSizing.',
  'core.font.numeric.',
];

/**
 * Resolve a token reference to its raw value from the theme's core layer.
 * Only used for the two namespaces Chakra cannot resolve.
 */
const resolveRawValue = (
  ref: string,
  core: ThemeTokensV2['core']
): string | undefined => {
  const path = extractRefPath(ref);
  // Navigate the core object following dot-separated segments after 'core.'
  const segments = path.split('.');
  if (segments[0] !== 'core') {
    return undefined;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = core;
  for (let i = 1; i < segments.length; i++) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = current[segments[i]];
  }
  return typeof current === 'string' || typeof current === 'number'
    ? String(current)
    : undefined;
};

const shouldInlineResolve = (ref: string): boolean => {
  const inner = extractRefPath(ref);
  return INLINE_RESOLVE_PREFIXES.some((prefix) => {
    return inner.startsWith(prefix);
  });
};

const transformTextStyles = (
  text: ThemeTokensV2['semantic']['text'],
  core: ThemeTokensV2['core']
): Record<string, unknown> => {
  const result: Record<string, Record<string, unknown>> = {};

  for (const [family, sizes] of Object.entries(text)) {
    result[family] = {};

    for (const [size, style] of Object.entries(
      sizes as Record<string, Record<string, string>>
    )) {
      const transformedProps: Record<string, string> = {};

      for (const [prop, value] of Object.entries(style)) {
        if (isTokenRef(value) && shouldInlineResolve(value)) {
          const raw = resolveRawValue(value, core);
          transformedProps[prop] = raw ?? value;
        } else {
          transformedProps[prop] = isTokenRef(value)
            ? toChakraRef(value)
            : value;
        }
      }

      (result[family] as Record<string, unknown>)[size] = {
        value: transformedProps,
      };
    }
  }

  return result;
};

// ---------------------------------------------------------------------------
// toChakraTheme
// ---------------------------------------------------------------------------

/**
 * Convert a `ThemeTokensV2` into a Chakra UI v3 `createSystem()` config.
 *
 * Maps core tokens → `theme.tokens`, semantic tokens → `theme.semanticTokens`,
 * text styles → `theme.textStyles`, and breakpoints → top-level `breakpoints`.
 *
 * @example
 * ```ts
 * import { themes, toChakraTheme } from '@ttoss/theme2';
 * import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
 *
 * const system = createSystem(defaultConfig, toChakraTheme(themes.bruttal));
 * ```
 */
export const toChakraTheme = (theme: ThemeTokensV2): ChakraThemeConfig => {
  const { core, semantic } = theme;

  return {
    theme: {
      tokens: {
        colors: wrapValues(core.colors as unknown as Record<string, unknown>),
        shadows: wrapValues(
          core.elevation.level as unknown as Record<string, unknown>
        ),
        fonts: wrapValues(
          core.font.family as unknown as Record<string, unknown>
        ),
        fontWeights: wrapValues(
          core.font.weight as unknown as Record<string, unknown>
        ),
        lineHeights: wrapValues(
          core.font.leading as unknown as Record<string, unknown>
        ),
        letterSpacings: wrapValues(
          core.font.tracking as unknown as Record<string, unknown>
        ),
        fontSizes: wrapValues(
          core.type.ramp as unknown as Record<string, unknown>
        ),
        spacing: wrapValues(core.space as unknown as Record<string, unknown>),
        sizes: wrapValues(core.size as unknown as Record<string, unknown>),
        radii: wrapValues(core.radii as unknown as Record<string, unknown>),
        borderWidths: wrapValues(
          core.borders.width as unknown as Record<string, unknown>
        ),
        borderStyles: wrapValues(
          core.borders.style as unknown as Record<string, unknown>
        ),
        opacity: wrapValues(core.opacity as unknown as Record<string, unknown>),
        durations: wrapValues(
          core.motion.duration as unknown as Record<string, unknown>
        ),
        easings: wrapValues(
          core.motion.easing as unknown as Record<string, unknown>
        ),
        zIndex: wrapValues(core.zIndex as unknown as Record<string, unknown>),
      },

      semanticTokens: {
        colors: wrapAndTransformRefs(
          semantic.colors as unknown as Record<string, unknown>
        ),
        shadows: wrapAndTransformRefs(
          semantic.elevation as unknown as Record<string, unknown>
        ),
        spacing: wrapAndTransformRefs(
          semantic.spacing as unknown as Record<string, unknown>
        ),
        sizes: wrapAndTransformRefs(
          semantic.sizing as unknown as Record<string, unknown>
        ),
        radii: wrapAndTransformRefs(
          semantic.radii as unknown as Record<string, unknown>
        ),
        borders: wrapAndTransformRefs(
          semantic.border as unknown as Record<string, unknown>
        ),
        opacity: wrapAndTransformRefs(
          semantic.opacity as unknown as Record<string, unknown>
        ),
        motion: wrapAndTransformRefs(
          semantic.motion as unknown as Record<string, unknown>
        ),
        zIndex: wrapAndTransformRefs(
          semantic.zIndex as unknown as Record<string, unknown>
        ),
      },

      textStyles: transformTextStyles(semantic.text, core),
    },

    breakpoints: { ...core.breakpoints },
  };
};
