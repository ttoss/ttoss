import { BruttalTheme } from '@ttoss/theme/Bruttal';
import { theme as Siflor } from './siflor';
import { THEME_GLOBAL_KEY } from './../constants/theme-global';
import { theme as Triangulos } from './triangulos';
import type { Theme } from '@ttoss/ui';

const initialDynamicTheme = {
  ...BruttalTheme,
};

// Documentation to know what the variant to use
// https://theme-ui.com/components/variants/

const getDynamicTheme = () => {
  const sDynamicTheme = localStorage.getItem(THEME_GLOBAL_KEY);

  if (!sDynamicTheme) {
    localStorage.setItem(THEME_GLOBAL_KEY, JSON.stringify(initialDynamicTheme));

    return initialDynamicTheme;
  }

  return JSON.parse(sDynamicTheme);
};

export const themes: { [key: string]: Theme } = {
  Siflor,
  Triangulos,
  Bruttal: BruttalTheme,
  Dynamic: getDynamicTheme(),
};
