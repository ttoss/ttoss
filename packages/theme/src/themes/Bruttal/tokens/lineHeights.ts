import {
  calcDividingValues,
  calcMultiplyingValues,
} from '../../../../src/themes/Bruttal/helpers/geometricCalc';

const BASE = 100;

const MULTIPLIER_FACTOR = 1.333;

const SIZE_TYPE = '%';

export const lineHeights = {
  '2xs': calcMultiplyingValues(BASE, MULTIPLIER_FACTOR, -3, SIZE_TYPE),
  xs: calcMultiplyingValues(BASE, MULTIPLIER_FACTOR, -2, SIZE_TYPE),
  sm: calcDividingValues(BASE, MULTIPLIER_FACTOR, 1, SIZE_TYPE),
  base: 'normal',
  lg: calcMultiplyingValues(BASE, MULTIPLIER_FACTOR, 1, SIZE_TYPE),
  xl: calcMultiplyingValues(BASE, MULTIPLIER_FACTOR, 2, SIZE_TYPE),
  '2xl': calcMultiplyingValues(BASE, MULTIPLIER_FACTOR, 3, SIZE_TYPE),
  flat: '100%',
};
