import { defaultTheme } from './themes/default/defaultTheme';
import deepmerge from 'deepmerge';
import type { Theme } from 'theme-ui';

export type { Theme };

export const createTheme = (
  theme: Theme,
  base: Theme = defaultTheme
): Theme => {
  return deepmerge(base, theme);
};
