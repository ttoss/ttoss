import { BruttalTheme } from './themes/Bruttal/BruttalTheme';
import { Theme, merge } from 'theme-ui';

export const createTheme = (theme: Theme): Theme => {
  return merge(BruttalTheme, theme);
};
