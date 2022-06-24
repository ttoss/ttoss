import { configCreator } from './configCreator';

export const defaultConfig: any = {
  '*.{js,jsx,ts,tsx}': 'eslint --fix',
  '*.{md,mdx,html,json,yml,yaml}': 'prettier --write',
};

export const lintstagedConfig = configCreator(defaultConfig);
