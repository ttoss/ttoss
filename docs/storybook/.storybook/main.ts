// This file has been automatically migrated to valid ESM format by Storybook.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import type { StorybookConfig } from '@storybook/react-webpack5';

const require = createRequire(import.meta.url);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getAbsolutePath = (value: string): any => {
  return dirname(require.resolve(join(value, 'package.json')));
};

/**
 * `maplibre-gl` is not a dependency of this package, only of `@ttoss/geovis`,
 * so `.storybook/preview.tsx` resolves it through geovis to reach its worker
 * file (see `configureMapLibreWorker` there).
 */
const maplibreDir = dirname(
  require.resolve('maplibre-gl/package.json', {
    paths: [dirname(require.resolve('@ttoss/geovis'))],
  })
);

/**
 * `@ttoss/react-openapi` styles its components with Tailwind, compiled from
 * `src/styles.css`. Only that stylesheet goes through PostCSS + Tailwind: the
 * default `.css` rule is cloned for it with `postcss-loader` appended, and
 * excluded from the original, so no other story's CSS is touched.
 */
const REACT_OPENAPI_CSS = /react-openapi[\\/]src[\\/]styles\.css$/;

type WebpackConfig = Parameters<
  NonNullable<StorybookConfig['webpackFinal']>
>[0];

const addTailwindForReactOpenApi = (webpackConfig: WebpackConfig) => {
  const rules = webpackConfig.module?.rules ?? [];
  const cssRule = rules.find((rule) => {
    return (
      typeof rule === 'object' &&
      rule !== null &&
      rule.test instanceof RegExp &&
      rule.test.source === '\\.css$'
    );
  });
  if (!cssRule || typeof cssRule !== 'object' || !Array.isArray(cssRule.use)) {
    throw new Error('Storybook default CSS rule not found.');
  }
  rules.push({
    ...cssRule,
    test: REACT_OPENAPI_CSS,
    use: [
      ...cssRule.use,
      {
        loader: require.resolve('postcss-loader'),
        options: {
          postcssOptions: {
            plugins: [require.resolve('@tailwindcss/postcss')],
          },
        },
      },
    ],
  });
  cssRule.exclude = REACT_OPENAPI_CSS;
};

const config: StorybookConfig = {
  /**
   * TODO: automatic title generation
   * https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   */
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  /**
   * Served at the root of both `storybook dev` and the built site, so stories
   * can reference generated assets by absolute path. Currently holds the
   * vector-tile pyramid behind `GeoVis/ClusterTiles`, built by
   * `packages/geovis/scripts/generateClusterFixtureTiles.ts`.
   */
  staticDirs: ['../public'],
  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-webpack5-compiler-babel'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-webpack5'),
    options: {},
  },
  webpackFinal: (webpackConfig) => {
    webpackConfig.resolve = {
      ...webpackConfig.resolve,
      alias: {
        ...webpackConfig.resolve?.alias,
        'maplibre-gl': maplibreDir,
      },
    };
    // Emit MapLibre's worker as a file and import its URL instead of its code.
    webpackConfig.module?.rules?.push({
      test: /maplibre-gl-worker\.mjs$/,
      type: 'asset/resource',
    });
    addTailwindForReactOpenApi(webpackConfig);
    return webpackConfig;
  },
  refs: {
    '@chakra-ui/react': {
      disable: true,
    },
  },
};

export default config;
