import * as typescriptConfig from './typescriptConfig';
import { Plugin, PluginBuild } from 'esbuild';
import { configCreator } from './configCreator';
import { transformAsync } from '@babel/core';
import type { Options } from 'tsup';

/**
 * This plugin is used to extract messages from source code and compile them,
 * adding `id` to each message. This is necessary for the i18n library to
 * correctly identify messages and translate them.
 *
 * Check [Automatic ID Generation](https://formatjs.github.io/docs/getting-started/message-extraction#automatic-id-generation)
 * for more information.
 */
const formatjsPlugin: Plugin = {
  name: 'formatjs',
  setup: (build: PluginBuild) => {
    build.onEnd(async (result) => {
      await Promise.all(
        (result.outputFiles || []).map(async (outputFile) => {
          if (
            !outputFile.path.endsWith('.js') &&
            !outputFile.path.endsWith('.mjs') &&
            !outputFile.path.endsWith('.cjs')
          ) {
            return;
          }

          const transformedFile = await transformAsync(outputFile.text, {
            caller: {
              name: 'formatjs-transformer',
              supportsStaticESM: true,
            },
            filename: outputFile.path,
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
            outputFile.contents = Buffer.from(transformedFile.code);
          }
        })
      );
    });
  },
};

export const defaultConfig: Options = {
  clean: true,
  dts: true,
  entryPoints: ['src/index.ts'],
  format: ['cjs', 'esm'],
  /**
   * legacyOutput `true` because some libraries don't support `.mjs`.
   */
  legacyOutput: true,
  /**
   * Becomes difficult to debug if code is minified.
   */
  minify: false,
  banner: {
    js: `/** Powered by @ttoss/config. https://ttoss.dev/docs/modules/packages/config/ */`,
  },
  esbuildPlugins: [formatjsPlugin],
  target: typescriptConfig.target,
};

/**
 * any on configCreator to avoid error "The inferred type of 'tsup' cannot
 * be named without a reference to '.../node_modules/tsup'. This is likely not
 * portable. A type annotation is necessary."
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tsupConfig = configCreator<any>(defaultConfig);
