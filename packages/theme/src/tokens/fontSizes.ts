import { calcMultiplyingValues } from '../helpers/geometricCalc';

const SIZE_TYPE = 'rem';

const BASE = 1;

const MULTIPLIER_FACTOR = 1.333;

export const fontSizes = {
  '2xs': calcMultiplyingValues(BASE, MULTIPLIER_FACTOR, -3),
  xs: calcMultiplyingValues(BASE, MULTIPLIER_FACTOR, -2),
  sm: calcMultiplyingValues(BASE, MULTIPLIER_FACTOR, -1),
  base: `${BASE}${SIZE_TYPE}`,
  lg: calcMultiplyingValues(BASE, MULTIPLIER_FACTOR, 1),
  xl: calcMultiplyingValues(BASE, MULTIPLIER_FACTOR, 2),
  '2xl': calcMultiplyingValues(BASE, MULTIPLIER_FACTOR, 3),
  '3xl': calcMultiplyingValues(BASE, MULTIPLIER_FACTOR, 4),
  '4xl': calcMultiplyingValues(BASE, MULTIPLIER_FACTOR, 5),
  '5xl': calcMultiplyingValues(BASE, MULTIPLIER_FACTOR, 6),
  '6xl': calcMultiplyingValues(BASE, MULTIPLIER_FACTOR, 7),
};
