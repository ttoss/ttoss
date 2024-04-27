import { configCreator } from './configCreator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultConfig: any = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
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
    [
      'formatjs',
      {
        idInterpolationPattern: '[sha512:contenthash:base64:6]',
        ast: true,
      },
    ],
  ],
};

export const babelConfig = configCreator(defaultConfig);
