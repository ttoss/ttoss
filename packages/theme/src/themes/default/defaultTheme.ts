import type { Theme } from 'theme-ui';

import {
  borders,
  breakpoints,
  fontSizes,
  fontWeights,
  letterSpacings,
  lineHeights,
  radii,
  sizes,
  spacing,
  zIndices,
} from '../../defaultTokens/index';

export const defaultTheme: Theme = {
  breakpoints: Object.values(breakpoints),
  fontSizes,
  fontWeights,
  letterSpacings,
  lineHeights,
  radii,
  sizes,
  space: spacing,
  zIndices,
  borders,
};
