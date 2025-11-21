/**
 * Jest needs Babel to transpile files.
 */
// eslint-disable-next-line no-undef
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' }, loose: true }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [
    /**
     * Carlin is full ESM and jest doesn't support import.meta.url from
     * @ttoss/cloudformation. This plugin is needed to transform import.meta.url
     *
     * More reference about pure ESM packages:
     * https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
     */
    'babel-plugin-transform-import-meta',
    /**
     * This plugin is needed to create a unique ID for each message in the
     * translation files.
     */
    [
      'formatjs',
      {
        idInterpolationPattern: '[sha512:contenthash:base64:6]',
        ast: true,
      },
    ],
    /**
     * Decorators are not supported in ES6, so we need to use this plugin to
     * transpile decorators to ES5.
     */
    ['@babel/plugin-proposal-decorators', { version: 'legacy' }],
  ],
};
