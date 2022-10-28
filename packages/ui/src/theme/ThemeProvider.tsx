import * as React from 'react';
import { Global, css } from '@emotion/react';
import { Theme, ThemeProvider as ThemeUiProvider, merge } from 'theme-ui';
import { defaultFonts } from '@ttoss/theme';
import { defaultTheme } from '@ttoss/theme';

export type ThemeProviderProps = {
  children?: React.ReactNode;
  theme?: Theme;
  /**
   * Fonts URLs.
   */
  fonts?: string[];
};

const ThemeProvider = ({
  children,
  theme = {},
  fonts = defaultFonts,
}: ThemeProviderProps) => {
  const mergedTheme = React.useMemo(() => {
    if (typeof theme === 'function') {
      return theme;
    }

    return merge(defaultTheme, theme);
  }, [theme]);

  return (
    <>
      <ThemeUiProvider theme={mergedTheme}>
        {fonts.map((url) => (
          <Global
            key={url}
            styles={css`
              @import url('${url}');
            `}
          />
        ))}
        {children}
      </ThemeUiProvider>
    </>
  );
};

export default ThemeProvider;
