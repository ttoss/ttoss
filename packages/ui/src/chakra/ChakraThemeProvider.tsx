/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChakraProvider as ChakraProviderBase,
  createSystem,
  defaultConfig,
} from '@chakra-ui/react';
import * as React from 'react';
import type { Theme } from 'theme-ui';

import { useTheme } from '../theme/useTheme';
import * as recipes from './recipes/recipes';
import * as slotRecipes from './recipes/slotRecipes';

/**
 * Helper function to wrap token values in Chakra UI v3 format.
 * Each token value must be wrapped in an object with a `value` property.
 *
 * @param tokens - Object containing token values
 * @returns Tokens wrapped in Chakra v3 format
 */
const wrapTokenValues = <T extends Record<string, any>>(
  tokens: T | undefined
): Record<string, { value: any }> | undefined => {
  if (!tokens) {
    return undefined;
  }

  const wrapped: Record<string, { value: any }> = {};

  for (const [key, value] of Object.entries(tokens)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively wrap nested objects
      wrapped[key] = wrapTokenValues(value as Record<string, any>) as any;
    } else {
      wrapped[key] = { value };
    }
  }

  return wrapped;
};

/**
 * Converts a theme-ui `Theme` object into a Chakra UI v3 system.
 *
 * Only foundation tokens that are compatible between both systems are mapped.
 * Component-level styles (`buttons`, `forms`, etc.) are **not** transferred
 * because theme-ui and Chakra use fundamentally different component style APIs.
 *
 * @param themeUITheme - The active theme-ui theme (from `useThemeUI().theme`).
 * @param overrides    - Optional Chakra-specific config overrides applied on top.
 *
 * @example
 * ```tsx
 * const chakraSystem = toChakraTheme(themeUITheme, {
 *   theme: {
 *     tokens: {
 *       colors: {
 *         brand: { 500: { value: '#0469E3' } },
 *       },
 *     },
 *     recipes: {
 *       button: defineRecipe({ ... }),
 *     },
 *     slotRecipes: {
 *       steps: defineSlotRecipe({ ... }),
 *     },
 *   },
 * });
 * ```
 */
const toChakraTheme = (
  themeUITheme: Theme,
  overrides: Parameters<typeof createSystem>[1] = {}
) => {
  const config: Parameters<typeof createSystem>[1] = {
    theme: {
      tokens: {
        borders: wrapTokenValues(themeUITheme.borders),
        colors: wrapTokenValues(themeUITheme.rawColors),
        fonts: wrapTokenValues(themeUITheme.fonts),
        fontSizes: wrapTokenValues(themeUITheme.fontSizes),
        fontWeights: wrapTokenValues(themeUITheme.fontWeights),
        letterSpacings: wrapTokenValues(themeUITheme.letterSpacings),
        lineHeights: wrapTokenValues(themeUITheme.lineHeights),
        radii: wrapTokenValues(themeUITheme.radii),
        sizes: wrapTokenValues(themeUITheme.sizes),
        spacing: wrapTokenValues(themeUITheme.space),
        zIndex: wrapTokenValues(themeUITheme.zIndices),
      },
      breakpoints:
        themeUITheme.breakpoints && Array.isArray(themeUITheme.breakpoints)
          ? {
              sm: themeUITheme.breakpoints[0],
              md: themeUITheme.breakpoints[1],
              lg: themeUITheme.breakpoints[2],
              xl: themeUITheme.breakpoints[3],
              '2xl': themeUITheme.breakpoints[4],
            }
          : undefined,
      // Recipes and slot recipes can be passed via overrides.theme
      recipes: { ...recipes, ...overrides.theme?.recipes },
      slotRecipes: { ...slotRecipes, ...overrides.theme?.slotRecipes },
    },
    ...overrides,
  };

  return createSystem(defaultConfig, config);
};

export type ChakraThemeProviderProps = {
  children?: React.ReactNode;
  /**
   * Optional Theme UI theme to use instead of reading from context.
   * Useful when you need to pass a specific theme directly.
   */
  themeUITheme?: Theme;
  /**
   * Optional Chakra-specific config overrides.
   * Use this to add recipes, slot recipes, or customize tokens.
   *
   * @example
   * ```tsx
   * <ChakraProvider
   *   overrides={{
   *     theme: {
   *       slotRecipes: {
   *         steps: stepsSlotRecipe,
   *       },
   *     },
   *   }}
   * >
   *   ...
   * </ChakraProvider>
   * ```
   */
  overrides?: Parameters<typeof createSystem>[1];
};

/**
 * Opt-in Chakra UI provider that inherits design tokens from the parent
 * theme-ui `ThemeProvider`.
 *
 * **Must be rendered as a child of `ThemeProvider`** so that `useThemeUI()`
 * can read the active theme (unless `themeUITheme` prop is provided).
 *
 * This component automatically converts theme-ui tokens to Chakra UI v3
 * system format, allowing seamless integration between both systems.
 *
 * @example Basic usage (inherits from ThemeProvider context)
 * ```tsx
 * import { ThemeProvider } from '@ttoss/ui';
 * import { ChakraProvider } from '@ttoss/ui/chakra';
 *
 * function App() {
 *   return (
 *     <ThemeProvider>
 *       <ChakraProvider>
 *         <Button colorScheme="blue">Click me</Button>
 *       </ChakraProvider>
 *     </ThemeProvider>
 *   );
 * }
 * ```
 *
 * @example With custom theme
 * ```tsx
 * <ChakraProvider themeUITheme={customTheme}>
 *   <Button>Click me</Button>
 * </ChakraProvider>
 * ```
 *
 * @example With recipe overrides
 * ```tsx
 * <ChakraProvider
 *   overrides={{
 *     theme: {
 *       slotRecipes: {
 *         steps: customStepsRecipe,
 *       },
 *     },
 *   }}
 * >
 *   <Steps.Root>...</Steps.Root>
 * </ChakraProvider>
 * ```
 */
export const ChakraProvider = ({
  children,
  themeUITheme: themeUIThemeProp,
  overrides,
}: ChakraThemeProviderProps) => {
  const themeUIThemeContext = useTheme();
  const themeUITheme = themeUIThemeProp ?? themeUIThemeContext.theme;

  const chakraSystem = React.useMemo(() => {
    return toChakraTheme(themeUITheme, overrides);
  }, [themeUITheme, overrides]);

  return (
    <ChakraProviderBase value={chakraSystem}>{children}</ChakraProviderBase>
  );
};
