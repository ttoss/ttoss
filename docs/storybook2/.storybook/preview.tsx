import type { Preview } from '@storybook/react-vite';
import { createTheme } from '@ttoss/theme2';
import {
  type ThemeMode,
  ThemeProvider,
  useColorMode,
} from '@ttoss/theme2/react';
import { bruttal } from '@ttoss/theme2/themes/bruttal';
import { corporate } from '@ttoss/theme2/themes/corporate';
import { oca } from '@ttoss/theme2/themes/oca';
import { ventures } from '@ttoss/theme2/themes/ventures';
import * as React from 'react';

const themes = {
  base: createTheme(),
  bruttal,
  corporate,
  oca,
  ventures,
} as const;

type ThemeKey = keyof typeof themes;

/**
 * Syncs the Storybook toolbar `colorMode` into the active ThemeProvider
 * runtime imperatively, so switching modes does not require remounting the
 * provider or juggling per-mode storage keys.
 */
const ColorModeSync = ({
  colorMode,
  children,
}: {
  colorMode: ThemeMode;
  children: React.ReactNode;
}) => {
  const { mode, setMode } = useColorMode();
  React.useEffect(() => {
    if (mode !== colorMode) setMode(colorMode);
  }, [colorMode, mode, setMode]);
  return <>{children}</>;
};

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Theme',
      defaultValue: 'base',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'base', title: 'Base Theme' },
          { value: 'bruttal', title: 'Bruttal' },
          { value: 'corporate', title: 'Corporate' },
          { value: 'oca', title: 'Oca' },
          { value: 'ventures', title: 'Ventures' },
        ],
      },
    },
    colorMode: {
      name: 'Color Mode',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'system', title: 'System', icon: 'mirror' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const themeKey = (context.globals.theme as ThemeKey) || 'base';
      const theme = themes[themeKey] || themes.base;
      const colorMode = (context.globals.colorMode as ThemeMode) || 'light';
      return (
        // themeId scopes each theme's CSS to [data-tt-theme="<key>"] so all
        // 5 theme stylesheets coexist cleanly; the runtime writes the matching
        // data-tt-theme attribute to activate the right one.
        // ColorModeSync forwards toolbar changes to the runtime imperatively,
        // avoiding provider remounts on every mode flip.
        <ThemeProvider
          theme={theme}
          themeId={themeKey}
          defaultMode={colorMode}
          storageKey={`storybook-${themeKey}`}
        >
          <ColorModeSync colorMode={colorMode}>
            <div
              style={{
                background:
                  'var(--tt-colors-content-primary-background-default)',
                color: 'var(--tt-colors-content-primary-text-default)',
              }}
            >
              <Story />
            </div>
          </ColorModeSync>
        </ThemeProvider>
      );
    },
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { disable: true },
    options: {
      storySort: {
        method: 'alphabetical',
        order: [
          'Introduction',
          'theme-v2',
          [
            'Overview',
            'Tokens',
            [
              'Colors',
              'Typography',
              'Spacing',
              'Elevation',
              'Motion',
              'Graph',
              '*',
            ],
            '*',
          ],
          'ui2',
          '*',
        ],
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
