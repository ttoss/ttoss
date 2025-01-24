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
  return (
    <>
      <ThemeUIProvider theme={theme}>
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
      </ThemeUIProvider>
    </>
  );
};
