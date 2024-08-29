import * as React from 'react';
import { BruttalFonts, BruttalTheme } from '@ttoss/theme/Bruttal';
import { ChakraProvider } from '@chakra-ui/react';
import { Global, css } from '@emotion/react';
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
