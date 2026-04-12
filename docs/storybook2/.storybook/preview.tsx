import '@ttoss/ui2/styles.css';

import type { Preview } from '@storybook/react-vite';
import { createTheme } from '@ttoss/theme2';
import { ThemeProvider } from '@ttoss/theme2/react';
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
  },
  decorators: [
    (Story, context) => {
      const themeKey = (context.globals.theme as keyof typeof themes) || 'base';
      const theme = themes[themeKey] || themes.base;
      return (
        <ThemeProvider theme={theme}>
          <Story />
        </ThemeProvider>
      );
    },
  ],
  parameters: {
    layout: 'centered',
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
