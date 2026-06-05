import { transformAsync } from '@babel/core';

import { configCreator } from './configCreator';
import * as typescriptConfig from './typescriptConfig';

/**
 * @deprecated Use `formatjsPlugin` from `src/tsdown` instead.
 *
 * This plugin is used to extract messages from source code and compile them,
 * adding `id` to each message. This is necessary for the i18n library to
 * correctly identify messages and translate them.
 *
 * Check [Automatic ID Generation](https://formatjs.github.io/docs/getting-started/message-extraction#automatic-id-generation)
 * for more information.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatjsPlugin: any = {
  name: 'formatjs',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setup: (build: any) => {
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
 * @deprecated Use `injectReactImport` from `src/tsdown` instead.
 *
 * ESBuild plugin to automatically inject React import.
 *
 * Adds "import * as React from 'react';" if:
 * - Code uses React. (like React.createElement)
 * - No basic React import exists
 *
 * Fix: https://github.com/egoist/tsup/issues/792
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const processOutputFile = (outputFile: any): void => {
  if (!outputFile.path.endsWith('.js')) {
    return;
  }

  let contents: string = outputFile.text;

  if (!/React\./.test(contents)) {
    return;
  }

  const hasStarReactImport =
    /import\s+\*\s+as\s+React\s+from\s+['"]react['"]/.test(contents);
  const hasDefaultReactImport =
    /import\s+React\s+from\s+['"]react['"]/.test(contents) ||
    /const\s+React\s+=\s+require\(['"]react['"]\)/.test(contents);

  if (hasStarReactImport || hasDefaultReactImport) {
    return;
  }

  const bannerMatch = contents.match(/^((?:\/\/[^\n]*\n|\/\*[^]*?\*\/)\s*)*/);
  const insertPosition = bannerMatch ? bannerMatch[0].length : 0;

  const isESM = /\bimport\b|\bexport\b/.test(contents);
  const isCJS = /\brequire\(|module\.exports\b/.test(contents);
  const importStatement =
    isCJS && !isESM
      ? `const React = require('react');\n`
      : `import * as React from 'react';\n`;

  contents =
    contents.slice(0, insertPosition) +
    importStatement +
    contents.slice(insertPosition);

  outputFile.contents = new TextEncoder().encode(contents);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const injectReactImport = (): any => {
  return {
    name: '@ttoss/esbuild-inject-react-import',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setup: (build: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      build.onEnd((result: any) => {
        for (const outputFile of result.outputFiles || []) {
          processOutputFile(outputFile);
        }
      });
    },
  };
};

/**
 * @deprecated Use `defaultConfig` from `src/tsdown` instead.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultConfig: any = {
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
 * @deprecated Use `tsdownConfig` from `src/tsdown` instead.
 *
 * any on configCreator to avoid error "The inferred type of 'tsup' cannot
 * be named without a reference to '.../node_modules/tsup'. This is likely not
 * portable. A type annotation is necessary."
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tsupConfig = configCreator<any>(defaultConfig);
