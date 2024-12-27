import { Preview } from '@storybook/react';
import { themesObjects, defaultThemeObject } from '../themes/themesObject';
import { I18nProvider } from '@ttoss/react-i18n';
import { ThemesProvider } from '../themes/ThemesProvider';

const themesNames = themesObjects.map((themeObject) => themeObject.name).sort();

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
  },
  initialGlobals: {
    theme: defaultThemeObject.name,
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
};

export default preview;
