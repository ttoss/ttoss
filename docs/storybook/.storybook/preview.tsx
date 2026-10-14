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
 * maplibre-gl 6 starts its worker from a file next to its own module, which
 * webpack does not emit. Point it at the copy `.storybook/main.ts` emits as an
 * asset, before any map story mounts a map.
 */
const configureMapLibreWorker = async ({ title }: { title: string }) => {
  if (!/^geovis/i.test(title)) {
    return {};
  }
  const [{ getWorkerUrl, setWorkerUrl }, { default: workerUrl }] =
    await Promise.all([
      import('maplibre-gl'),
      import('maplibre-gl/dist/maplibre-gl-worker.mjs') as Promise<{
        default: string;
      }>,
    ]);
  if (!getWorkerUrl()) {
    setWorkerUrl(workerUrl);
  }
  return {};
};

/**
 * https://storybook.js.org/docs/essentials/toolbars-and-globals
 */
const preview: Preview = {
  loaders: [configureMapLibreWorker],
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
        order: [
          'Introduction',
          'GeoVis',
          [
            'Fixtures',
            [
              'SingleMap',
              'GeoJsonUrlMap',
              'MapWithSidePanel',
              'LinkedMapChart',
              'SplitCompare',
              'InvalidRawCountChoropleth',
              'MunicipalDistrictMapData',
              'GenderDominanceBivariate',
              'SteppedProportionalCircles',
              '*',
            ],
            '*',
          ],
          '*',
        ],
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
