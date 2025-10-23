import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig,
} from '@chakra-ui/react';
import { Preview } from '@storybook/react-webpack5';
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
      // Constrói um system do Chakra a partir do seu themeObject
      const config = defineConfig({
        theme: {
          semanticTokens: {
            colors: {
              bg: {
                DEFAULT: { value: '{colors.gray.100}' },
                primary: { value: '{colors.teal.100}' },
                secondary: { value: '{colors.gray.100}' },
              },
            },
          },
        },
      });

      const system = createSystem(defaultConfig, config);

      return (
        <I18nProvider>
          <ThemesProvider themeName={context.globals.theme}>
            <ChakraProvider value={system}>
              <Story />
            </ChakraProvider>
          </ThemesProvider>
        </I18nProvider>
      );
    },
  ],
  tags: ['autodocs'],
};

export default preview;
