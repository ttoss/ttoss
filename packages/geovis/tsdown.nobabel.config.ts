/**
 * TEMPORARY build config — builds @ttoss/geovis WITHOUT the shared
 * `formatjs` babel plugin, which crashes under Node's ESM `require(esm)`
 * ("@babel/helper-plugin-utils is not in cache"). geovis has no i18n messages,
 * so the plugin is a no-op for it. Used only to regenerate a local test patch
 * for cozsolidarias; delete after use.
 */
import type { Rolldown } from 'tsdown';
import { defineConfig } from 'tsdown';

/** Copied from @ttoss/config (not exported) — injects `import * as React`. */
const injectReactImport = (): Rolldown.Plugin => {
  return {
    name: '@ttoss/inject-react-import',
    renderChunk: (code, chunk) => {
      if (!chunk.fileName.endsWith('.js') && !chunk.fileName.endsWith('.mjs')) {
        return null;
      }
      if (!/React\./.test(code)) {
        return null;
      }
      const hasStarReactImport =
        /import\s+\*\s+as\s+React\s+from\s+['"]react['"]/.test(code);
      const hasDefaultReactImport =
        /import\s+React\s+from\s+['"]react['"]/.test(code) ||
        /const\s+React\s+=\s+require\(['"]react['"]\)/.test(code);
      if (hasStarReactImport || hasDefaultReactImport) {
        return null;
      }
      const bannerMatch = code.match(/^((?:\/\/[^\n]*\n|\/\*[^]*?\*\/)\s*)*/);
      const insertPosition = bannerMatch ? bannerMatch[0].length : 0;
      const isESM = /\bimport\b|\bexport\b/.test(code);
      const isCJS = /\brequire\(|module\.exports\b/.test(code);
      const importStatement =
        isCJS && !isESM
          ? `const React = require('react');\n`
          : `import * as React from 'react';\n`;
      return {
        code:
          code.slice(0, insertPosition) +
          importStatement +
          code.slice(insertPosition),
      };
    },
  };
};

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index'],
  format: ['cjs', 'esm'],
  minify: false,
  banner: {
    js: `/** Powered by @ttoss/config. https://ttoss.dev/docs/modules/packages/config/ */`,
  },
  plugins: [injectReactImport()],
  target: 'es2024',
  outputOptions: { topLevelVar: true },
});
