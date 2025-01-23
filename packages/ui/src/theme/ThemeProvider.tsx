import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { css, Global } from '@emotion/react';
import { BruttalFonts, BruttalTheme } from '@ttoss/theme/Bruttal';
import * as React from 'react';
import { Theme, ThemeUIProvider } from 'theme-ui';

export type ThemeProviderProps = {
  children?: React.ReactNode;
  theme?: Theme;
  /**
   * Fonts URLs.
   */
  fonts?: string[];
};

export const ThemeProvider = ({
  children,
  theme = BruttalTheme,
  fonts = BruttalFonts,
}: ThemeProviderProps) => {
  // const config = defineConfig({
  //   preflight: true,
  //   cssVarsPrefix: 'chakra',
  //   cssVarsRoot: ':where(html, .chakra-theme)',
  //   theme: {
  //     breakpoints,
  //     tokens: {
  //       borders: theme.borders as any,
  //       fonts: theme.fonts as any,
  //       fontSizes: theme.fontSizes as any,
  //       fontWeights: theme.fontWeights as any,
  //       letterSpacings: theme.letterSpacings as any,
  //       lineHeights: theme.lineHeights as any,
  //       radii: theme.radii as any,
  //       spacing: theme.space as any,
  //       sizes: theme.sizes as any,
  //       zIndex: theme.zIndices as any,
  //     },
  //     semanticTokens: {
  //       colors: theme.colors as any,
  //     },
  //   },
  // });

  // const system = createSystem(config);

  return (
    <>
      <ThemeUIProvider theme={theme}>
        <ChakraProvider value={defaultSystem}>
          <Global
            styles={css`
              ${fonts
                .map((url) => {
                  return `@import url('${url}');`;
                })
                .join('\n')}
            `}
          />
          {children}
        </ChakraProvider>
      </ThemeUIProvider>
    </>
  );
};
