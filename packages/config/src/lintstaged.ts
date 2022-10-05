import { configCreator } from './configCreator';

export const defaultConfig: any = {
  '*.{js,jsx,ts,tsx}': 'eslint --quiet --fix',
  '*.{md,mdx,html,json,yml,yaml}': 'prettier --write',
  'package.json': 'prettier-package-json --write',
};

export const lintstagedConfig = configCreator(defaultConfig);
