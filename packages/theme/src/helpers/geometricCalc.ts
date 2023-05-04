const SIZE_TYPE = 'rem';

export const calcMultiplyingValues = (
  initialValue: number,
  base: number,
  ratio: number,
  sizeType = SIZE_TYPE
) => {
  const result = initialValue * Math.pow(base, ratio);

  return `${result.toFixed(2)}${sizeType}`;
};

export const calcDividingValues = (
  initialValue: number,
  base: number,
  ratio: number,
  sizeType = SIZE_TYPE
) => {
  const result = initialValue / Math.pow(base, ratio);

  return `${result.toFixed(2)}${sizeType}`;
};
