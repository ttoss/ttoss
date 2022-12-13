import * as React from 'react';
import { DefaultFonts, DefaultTheme } from '@ttoss/theme';
import { Global, css } from '@emotion/react';
import { Theme, ThemeProvider as ThemeUiProvider, merge } from 'theme-ui';

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
  fonts = DefaultFonts,
}: ThemeProviderProps) => {
  const mergedTheme = React.useMemo(() => {
    if (typeof theme === 'function') {
      return theme;
    }

    return merge(DefaultTheme, theme);
  }, [theme]);

  return (
    <>
      <ThemeUiProvider theme={mergedTheme}>
        {fonts.map((url) => {
          return (
            <Global
              key={url}
              styles={css`
                @import url('${url}');
              `}
            />
          );
        })}
        {children}
      </ThemeUiProvider>
    </>
  );
};

export default ThemeProvider;
