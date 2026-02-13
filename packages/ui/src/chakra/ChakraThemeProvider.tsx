/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChakraProvider as ChakraProviderBase,
  createSystem,
  defaultConfig,
} from '@chakra-ui/react';
import * as React from 'react';
import type { Theme } from 'theme-ui';

import { useTheme } from '../theme/useTheme';

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
        colors: wrapTokenValues(themeUITheme.rawColors ?? themeUITheme.colors),
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
    },
    ...overrides,
  };

  return createSystem(defaultConfig, config);
};

export type ChakraThemeProviderProps = {
  children?: React.ReactNode;
};

/**
 * Opt-in Chakra UI provider that inherits design tokens from the parent
 * theme-ui `ThemeProvider`.
 *
 * **Must be rendered as a child of `ThemeProvider`** so that `useThemeUI()`
 * can read the active theme.
 *
 * This component automatically converts theme-ui tokens to Chakra UI v3
 * system format, allowing seamless integration between both systems.
 *
 * @example
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
 */
export const ChakraProvider = ({ children }: ChakraThemeProviderProps) => {
  const themeUITheme = useTheme();

  const chakraSystem = React.useMemo(() => {
    return toChakraTheme(themeUITheme.theme);
  }, [themeUITheme.theme]);

  return (
    <ChakraProviderBase value={chakraSystem}>{children}</ChakraProviderBase>
  );
};
