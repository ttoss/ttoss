import { transformAsync } from '@babel/core';
import { Plugin, PluginBuild } from 'esbuild';
import type { Options } from 'tsup';

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

/**
 * ESBuild plugin to automatically inject React import.
 *
 * Adds "import * as React from 'react';" if:
 * - Code uses React. (like React.createElement)
 * - No basic React import exists
 *
 * Fix: https://github.com/egoist/tsup/issues/792
 */
export const injectReactImport = (): Plugin => {
  return {
    name: '@ttoss/esbuild-inject-react-import',
    setup: (build) => {
      build.onEnd((result) => {
        if (result.outputFiles) {
          for (const outputFile of result.outputFiles) {
            if (outputFile.path.endsWith('.js')) {
              let contents = outputFile.text;

              // Check if React is used in the code
              const usesReact = /React\./.test(contents);

              if (usesReact) {
                // Check if basic React import already exists
                const hasBasicReactImport =
                  /import\s+\*\s+as\s+React\s+from\s+['"]react['"]/.test(
                    contents
                  );

                if (!hasBasicReactImport) {
                  // Match various comment styles at the start
                  const bannerMatch = contents.match(
                    /^((?:\/\/[^\n]*\n|\/\*[^]*?\*\/)\s*)*/
                  );
                  const insertPosition = bannerMatch
                    ? bannerMatch[0].length
                    : 0;

                  // Add basic React import
                  const isESM = /\bimport\b|\bexport\b/.test(contents);
                  const isCJS = /\brequire\(|module\.exports\b/.test(contents);

                  const importStatement = (() => {
                    if (isESM && !isCJS) {
                      return `import * as React from 'react';\n`;
                    } else if (isCJS && !isESM) {
                      return `const React = require('react');\n`;
                    } else {
                      // If both ESM and CJS patterns are found, default to ESM import
                      return `import * as React from 'react';\n`;
                    }
                  })();

                  contents =
                    contents.slice(0, insertPosition) +
                    importStatement +
                    contents.slice(insertPosition);

                  // Update file contents
                  outputFile.contents = new TextEncoder().encode(contents);
                }
              }
            }
          }
        }
      });
    },
  };
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
  esbuildPlugins: [formatjsPlugin, injectReactImport()],
  target: typescriptConfig.target,
};

/**
 * any on configCreator to avoid error "The inferred type of 'tsup' cannot
 * be named without a reference to '.../node_modules/tsup'. This is likely not
 * portable. A type annotation is necessary."
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tsupConfig = configCreator<any>(defaultConfig);
