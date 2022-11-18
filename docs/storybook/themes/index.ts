import { BruttalTheme as Bruttal } from '@ttoss/theme';
import { theme as Siflor } from './siflor';
import { THEME_GLOBAL_KEY } from './../constants/theme-global';
import { theme as Triangulos } from './triangulos';

import type { Theme } from '@ttoss/ui';

const initialDynamicTheme = {
  ...Bruttal,
  colors: {
    text: Bruttal.colors?.text,
    primary: Bruttal.colors?.primary,
    background: Bruttal.colors?.background,
    secondary: Bruttal.colors?.secondary,
    gray: Bruttal.colors?.gray,
    danger: Bruttal.colors?.danger,
    muted: Bruttal.colors?.muted,
  },
};

// Documentation to know what the variant to use
// https://theme-ui.com/components/variants/

function getDynamicTheme() {
  const sDynamicTheme = localStorage.getItem(THEME_GLOBAL_KEY);

  if (!sDynamicTheme) {
    localStorage.setItem(THEME_GLOBAL_KEY, JSON.stringify(initialDynamicTheme));

    return initialDynamicTheme;
  }

  return JSON.parse(sDynamicTheme);
}

export const themes: { [key: string]: Theme } = {
  Siflor,
  Triangulos,
  Bruttal,
  Dynamic: getDynamicTheme(),
};
