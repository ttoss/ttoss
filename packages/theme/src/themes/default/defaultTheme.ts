import {
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
import type { Theme } from 'theme-ui';

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
};
