import { BruttalTheme } from './themes/Bruttal/Bruttal';
import deepmerge from 'deepmerge';
import type { Theme } from './types';

export const createTheme = (theme: Theme): Theme => {
  return deepmerge(BruttalTheme, theme);
};
