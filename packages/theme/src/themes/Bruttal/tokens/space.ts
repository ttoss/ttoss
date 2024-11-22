import {
  calcDividingValues,
  calcMultiplyingValues,
} from '../../../../src/themes/Bruttal/helpers/geometricCalc';

const SIZE_TYPE = 'rem';

const MD = 0.5;

const MULTIPLIER_FACTOR = 1.618;

export const space = {
  none: 0,
  '2xs': calcDividingValues(MD, MULTIPLIER_FACTOR, 3),
  xs: calcDividingValues(MD, MULTIPLIER_FACTOR, 2),
  sm: calcDividingValues(MD, MULTIPLIER_FACTOR, 1),
  md: `${MD}${SIZE_TYPE}`,
  lg: calcMultiplyingValues(MD, MULTIPLIER_FACTOR, 1),
  xl: calcMultiplyingValues(MD, MULTIPLIER_FACTOR, 2),
  '2xl': calcMultiplyingValues(MD, MULTIPLIER_FACTOR, 3),
  '3xl': calcMultiplyingValues(MD, MULTIPLIER_FACTOR, 4),
  '4xl': calcMultiplyingValues(MD, MULTIPLIER_FACTOR, 5),
  '5xl': calcMultiplyingValues(MD, MULTIPLIER_FACTOR, 6),
  '6xl': calcMultiplyingValues(MD, MULTIPLIER_FACTOR, 7),
  '7xl': calcMultiplyingValues(MD, MULTIPLIER_FACTOR, 8),
};
