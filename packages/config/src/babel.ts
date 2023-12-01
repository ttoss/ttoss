import { configCreator } from './configCreator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultConfig: any = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [
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
