const { createRequire } = require('node:module');

const { babelConfig } = require('@ttoss/config');

/**
 * The same `babel-plugin-transform-import-meta` instance the shared config
 * uses, so the override below replaces its options instead of adding a
 * second copy.
 */
const importMetaPlugin = createRequire(
  require.resolve('@ttoss/config/package.json')
).resolve('babel-plugin-transform-import-meta');

module.exports = babelConfig({
  overrides: [
    {
      /**
       * yargs 18 and yargs-parser 22 are ESM-only and declare a module-level
       * `const require = createRequire(import.meta.url)`. The plugin's default
       * CommonJS output turns `import.meta.url` into a `require('url')` call,
       * which Babel binds to that shadowing `require` while it is still in
       * its temporal dead zone. The ES6 output imports `url` instead.
       */
      test: /[\\/]node_modules[\\/]yargs(-parser)?[\\/]/,
      plugins: [[importMetaPlugin, { module: 'ES6' }]],
    },
  ],
});
