import type { Preview } from '@storybook/react-webpack5';
import { I18nProvider } from '@ttoss/react-i18n';

import { defaultThemeObject, themesObjects } from '../themes/themesObject';
import { ThemesProvider } from '../themes/ThemesProvider';

const themesNames = themesObjects
  .map((themeObject) => {
    return themeObject.name;
  })
  .sort();

/**
 * https://storybook.js.org/docs/essentials/toolbars-and-globals
 */
const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: themesNames,
        dynamicTitle: true,
      },
    },
    themesObjects: {
      description: 'Themes objects',
    },
  },
  initialGlobals: {
    theme: defaultThemeObject.name,
    themesObjects,
  },
  decorators: [
    (Story, context) => {
      return (
        <I18nProvider>
          <ThemesProvider themeName={context.globals.theme}>
            <Story />
          </ThemesProvider>
        </I18nProvider>
      );
    },
  ],
  parameters: {
    options: {
      storySort: {
        method: 'alphabetical',
        order: ['Introduction', '*'],
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
