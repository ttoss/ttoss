const BASE = '1rem';

const MULTIPLIER_FACTOR = 1.333;

export const fontSizes = {
  '2xs': `calc(${BASE} * (${Math.pow(MULTIPLIER_FACTOR, -3)})`,
  xs: `calc(${BASE} * ${Math.pow(MULTIPLIER_FACTOR, -2)})`,
  sm: `calc(${BASE} * ${Math.pow(MULTIPLIER_FACTOR, -1)})`,
  base: BASE,
  lg: `calc(${BASE} * (${MULTIPLIER_FACTOR}^1))`,
  xl: `calc(${BASE} * (${MULTIPLIER_FACTOR}^2))`,
  '2xl': `calc(${BASE} * (${MULTIPLIER_FACTOR}^3))`,
  '3xl': `calc(${BASE} * (${MULTIPLIER_FACTOR}^4))`,
  '4xl': `calc(${BASE} * (${MULTIPLIER_FACTOR}^5))`,
  '5xl': `calc(${BASE} * (${MULTIPLIER_FACTOR}^6))`,
  '6xl': `calc(${BASE} * (${MULTIPLIER_FACTOR}^7))`,
};
