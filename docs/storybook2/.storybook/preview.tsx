import type { Preview } from '@storybook/react-vite';
import { createTheme } from '@ttoss/theme2';
import { ThemeProvider } from '@ttoss/theme2/react';
import * as React from 'react';

import '@ttoss/ui2/styles.css';

const defaultTheme = createTheme();

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider theme={defaultTheme}>
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
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
