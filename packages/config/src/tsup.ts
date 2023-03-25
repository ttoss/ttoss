import { Plugin, PluginBuild } from 'esbuild';
import { configCreator } from './configCreator';
import { transformAsync } from '@babel/core';
import type { Options } from 'tsup';

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
};

export const tsupConfig = configCreator(defaultConfig);
