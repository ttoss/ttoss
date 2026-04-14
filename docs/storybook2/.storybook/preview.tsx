import type { Preview } from '@storybook/react-vite';
import { createTheme } from '@ttoss/theme2';
import { ThemeProvider } from '@ttoss/theme2/react';
import { bruttal } from '@ttoss/theme2/themes/bruttal';
import { corporate } from '@ttoss/theme2/themes/corporate';
import { oca } from '@ttoss/theme2/themes/oca';
import { ventures } from '@ttoss/theme2/themes/ventures';

const themes = {
  base: createTheme(),
  bruttal,
  corporate,
  oca,
  ventures,
} as const;

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
      const themeKey = (context.globals.theme as keyof typeof themes) || 'base';
      const theme = themes[themeKey] || themes.base;
      const colorMode =
        (context.globals.colorMode as 'light' | 'dark' | 'system') || 'light';
      return (
        // key forces remount when colorMode changes so defaultMode is re-applied.
        // storageKey per-colorMode prevents stale localStorage from overriding
        // the toolbar selection (resolveTheme prefers stored value over defaultMode).
        <ThemeProvider
          key={`${themeKey}-${colorMode}`}
          theme={theme}
          defaultMode={colorMode}
          storageKey={`storybook-${themeKey}-${colorMode}`}
        >
          <div
            style={{
              background: 'var(--tt-colors-content-primary-background-default)',
              color: 'var(--tt-colors-content-primary-text-default)',
            }}
          >
            <Story />
          </div>
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
        order: ['Introduction', 'theme-v2', 'ui2', '*'],
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
