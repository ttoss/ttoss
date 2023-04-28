const MD = '0.5rem';

const MULTIPLIER_FACTOR = 1.618;

const multiValues = (length: number) => {
  return Array.from({ length })
    .map(() => {
      return MULTIPLIER_FACTOR;
    })
    .join(' * ');
};

export const space = {
  none: 0,
  '2xs': `calc(${MD} / (${multiValues(3)}))`,
  xs: `calc(${MD} / (${multiValues(2)}))`,
  sm: `calc(${MD} / (${MULTIPLIER_FACTOR}))`,
  md: MD,
  lg: `calc(${MD} * ${MULTIPLIER_FACTOR})`,
  xl: `calc(${MD} * ${multiValues(2)})`,
  '2xl': `calc(${MD} * ${multiValues(3)})`,
  '3xl': `calc(${MD} * ${multiValues(4)})`,
  '4xl': `calc(${MD} * ${multiValues(5)})`,
  '5xl': `calc(${MD} * ${multiValues(6)})`,
  '6xl': `calc(${MD} * ${multiValues(7)})`,
  '7xl': `calc(${MD} * ${multiValues(8)})`,
};
