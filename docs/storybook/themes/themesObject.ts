import type { Theme } from '@ttoss/theme';

import { Bruttal } from './themes/Bruttal';
import { Oca } from './themes/Oca';
import { Siflor } from './themes/Siflor';

export type ThemeObject = {
  name: string;
  fonts: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icons: any;
  theme: Theme;
};

export const defaultThemeObject: ThemeObject = Bruttal;

export const themesObjects: ThemeObject[] = [defaultThemeObject, Siflor, Oca];
