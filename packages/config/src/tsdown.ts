import { transformAsync } from '@babel/core';
import type { Rolldown, UserConfig } from 'tsdown';

import { configCreator } from './configCreator';
import * as typescriptConfig from './typescriptConfig';

/**
 * This plugin is used to extract messages from source code and compile them,
 * adding `id` to each message. This is necessary for the i18n library to
 * correctly identify messages and translate them.
 *
 * Check [Automatic ID Generation](https://formatjs.github.io/docs/getting-started/message-extraction#automatic-id-generation)
 * for more information.
 */
const formatjsPlugin: Rolldown.Plugin = {
  name: 'formatjs',
  renderChunk: async (code, chunk) => {
    if (
      !chunk.fileName.endsWith('.js') &&
      !chunk.fileName.endsWith('.mjs') &&
      !chunk.fileName.endsWith('.cjs')
    ) {
      return null;
    }

    const transformedFile = await transformAsync(code, {
      caller: {
        name: 'formatjs-transformer',
        supportsStaticESM: true,
      },
      filename: chunk.fileName,
      plugins: [
        [
          'formatjs',
          {
            idInterpolationPattern: '[sha512:contenthash:base64:6]',
            ast: true,
          },
        ],
      ],
    });

    if (transformedFile?.code) {
      return { code: transformedFile.code };
    }
    return null;
  },
};

export const defaultConfig: UserConfig = {
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  /**
   * Becomes difficult to debug if code is minified.
   */
  minify: false,
  banner: {
    js: `/** Powered by @ttoss/config. https://ttoss.dev/docs/modules/packages/config/ */`,
  },
  plugins: [formatjsPlugin],
  target: typescriptConfig.target,
};

/**
 * any on configCreator to avoid error "The inferred type of 'tsdownConfig' cannot
 * be named without a reference to '.../node_modules/tsdown'. This is likely not
 * portable. A type annotation is necessary."
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tsdownConfig = configCreator<any>(defaultConfig);

/**
 * @deprecated Use `tsdownConfig` instead.
 */
export const tsupConfig = tsdownConfig;
