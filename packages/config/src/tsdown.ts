import { transformAsync } from '@babel/core';
import type { Rolldown } from 'tsdown';

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
      configFile: false,
      babelrc: false,
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

/**
 * Rolldown plugin to automatically inject React import.
 *
 * Adds "import * as React from 'react';" if:
 * - Code uses React. (like React.createElement)
 * - No basic React import exists
 *
 * Fix: https://github.com/egoist/tsup/issues/792
 */
export const injectReactImport = (): Rolldown.Plugin => {
  return {
    name: '@ttoss/inject-react-import',
    renderChunk: (code, chunk) => {
      if (!chunk.fileName.endsWith('.js')) {
        return null;
      }

      // Skip files that do not use the React namespace.
      if (!/React\./.test(code)) {
        return null;
      }

      // Check if star React import already exists (e.g., import * as React from 'react';)
      const hasStarReactImport =
        /import\s+\*\s+as\s+React\s+from\s+['"]react['"]/.test(code);

      // Check if any basic React import exists (e.g., import React from 'react'; or const React = require('react');)
      const hasDefaultReactImport =
        /import\s+React\s+from\s+['"]react['"]/.test(code) ||
        /const\s+React\s+=\s+require\(['"]react['"]\)/.test(code);

      if (hasStarReactImport || hasDefaultReactImport) {
        return null;
      }

      // Match various comment styles at the start (e.g. banner injected before renderChunk)
      const bannerMatch = code.match(/^((?:\/\/[^\n]*\n|\/\*[^]*?\*\/)\s*)*/);
      const insertPosition = bannerMatch ? bannerMatch[0].length : 0;

      const isESM = /\bimport\b|\bexport\b/.test(code);
      const isCJS = /\brequire\(|module\.exports\b/.test(code);

      const importStatement = (() => {
        if (isESM && !isCJS) {
          return `import * as React from 'react';\n`;
        } else if (isCJS && !isESM) {
          return `const React = require('react');\n`;
        }
        // If both ESM and CJS patterns are found, default to ESM import
        return `import * as React from 'react';\n`;
      })();

      return {
        code:
          code.slice(0, insertPosition) +
          importStatement +
          code.slice(insertPosition),
      };
    },
  };
};

export const defaultConfig = {
  clean: true,
  dts: true,
  entry: ['src/index'],
  format: ['cjs', 'esm'],
  /**
   * Becomes difficult to debug if code is minified.
   */
  minify: false,
  banner: {
    js: `/** Powered by @ttoss/config. https://ttoss.dev/docs/modules/packages/config/ */`,
  },
  plugins: [formatjsPlugin, injectReactImport()],
  target: typescriptConfig.target,
  /**
   * Rewrite top-level `let`/`const` to `var` in CJS output so that
   * TypeScript's `typeof X === "undefined"` guard (emitted by
   * `emitDecoratorMetadata`) works correctly when circular imports cause a
   * class to be referenced before its initializer runs. With `let`/`const`,
   * `typeof X` throws a ReferenceError (TDZ); with `var`, it safely returns
   * `"undefined"` and the guard falls through to `Object` as intended.
   */
  outputOptions: { topLevelVar: true },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tsdownConfig = configCreator<any>(defaultConfig);
