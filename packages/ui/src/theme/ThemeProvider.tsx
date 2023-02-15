import * as React from 'react';
import { BruttalFonts, BruttalTheme } from '@ttoss/theme';
import { Global, css } from '@emotion/react';
import { Theme, ThemeProvider as ThemeUiProvider } from 'theme-ui';

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
      <ThemeUiProvider theme={theme}>
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
      </ThemeUiProvider>
    </>
  );
};
