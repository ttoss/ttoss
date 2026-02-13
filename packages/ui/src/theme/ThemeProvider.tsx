import { css, Global } from '@emotion/react';
import { BruttalFonts, BruttalTheme } from '@ttoss/theme/Bruttal';
import type * as React from 'react';
import type { Theme } from 'theme-ui';
import { ThemeUIProvider } from 'theme-ui';

import { ChakraProvider } from '../chakra/ChakraThemeProvider';

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
  return (
    <>
      <ThemeUIProvider theme={theme}>
        <ChakraProvider theme={theme}>
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
