import type { Theme } from 'theme-ui';

import { defaultTheme } from '../default/defaultTheme';
import { BruttalBadges } from './BruttalBadges';
import { BruttalButtons } from './BruttalButtons';
import { BruttalColors } from './BruttalColors';
import { BruttalForms } from './BruttalForms';
import { BruttalStyles } from './BruttalStyles';
import { BruttalText } from './BruttalText';

const coreFonts = {
  body: '"Atkinson Hyperlegible", sans-serif',
  heading: '"Work Sans", sans-serif',
  mono: '"Inconsolata", sans-serif',
};

const radii = {
  none: '0',
  '2xs': '0.0625rem',
  xs: '0.125rem',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.25rem',
  xl: '0.25rem',
  '2xl': '0.25rem',
  '3xl': '0.25rem',
  '4xl': '0.25rem',
  full: '9999px',
};

export const BruttalTheme: Theme = {
  /**
   * Tokens
   */
  borders: defaultTheme.borders,
  sizes: defaultTheme.sizes,
  fontSizes: defaultTheme.fontSizes,
  fontWeights: defaultTheme.fontWeights,
  letterSpacings: defaultTheme.letterSpacings,
  space: defaultTheme.space,
  lineHeights: defaultTheme.lineHeights,
  zIndices: defaultTheme.zIndices,
  colors: BruttalColors,
  fonts: coreFonts,
  radii,
  /**
   * Global styles
   */
  styles: BruttalStyles,
  /**
   * Components
   */
  badges: BruttalBadges,
  buttons: BruttalButtons,
  forms: BruttalForms,
  text: BruttalText,
};
