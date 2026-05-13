import { configCreator } from './configCreator';

export const defaultConfig = {
  '*.{js,jsx,ts,tsx}': 'eslint --quiet --fix',
  '*.{md,mdx,html,json,yml,yaml}': 'prettier --write',
  'package.json': 'node ./node_modules/@ttoss/config/bin/sort-package-json',
};

export const lintstagedConfig = configCreator(defaultConfig);
