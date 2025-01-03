import deepmerge from 'deepmerge';
import type { Theme } from 'theme-ui';

import { defaultTheme } from './themes/default/defaultTheme';

export type { Theme };

export const createTheme = (
  theme: Theme,
  base: Theme = defaultTheme
): Theme => {
  return deepmerge(base, theme);
};
