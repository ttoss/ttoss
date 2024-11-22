import {
  calcDividingValues,
  calcMultiplyingValues,
} from '../../../src/themes/Bruttal/helpers/geometricCalc';

test('should be defined', () => {
  expect(calcMultiplyingValues).toBeDefined();
  expect(calcDividingValues).toBeDefined();
});

const INITIAL_VALUE = 0.5;
const BASE = 1.5;
const RATIO = 2;
const CUSTOM_SIZE_TYPE = 'px';

test('should return a correct value with rem as size-type by default when call calcDividingValues function', () => {
  const expectedCalc = INITIAL_VALUE / Math.pow(BASE, RATIO);
  const expectedValue = `${expectedCalc.toFixed(2)}rem`;

  const result = calcDividingValues(INITIAL_VALUE, BASE, RATIO);

  expect(result).toEqual(expectedValue);
});

test('should return a correct value with px as size-type when call calcDividingValues function', () => {
  const expectedCalc = INITIAL_VALUE / Math.pow(BASE, RATIO);
  const expectedValue = `${expectedCalc.toFixed(2)}${CUSTOM_SIZE_TYPE}`;

  const result = calcDividingValues(
    INITIAL_VALUE,
    BASE,
    RATIO,
    CUSTOM_SIZE_TYPE
  );

  expect(result).toEqual(expectedValue);
});

test('should return a correct value with rem as size-type by default when call calcMultiplyingValues function', () => {
  const expectedCalc = INITIAL_VALUE * Math.pow(BASE, RATIO);
  const expectedValue = `${expectedCalc.toFixed(2)}rem`;

  const result = calcMultiplyingValues(INITIAL_VALUE, BASE, RATIO);

  expect(result).toEqual(expectedValue);
});

test('should return a correct value with px as size-type when call calcMultiplyingValues function', () => {
  const expectedCalc = INITIAL_VALUE * Math.pow(BASE, RATIO);
  const expectedValue = `${expectedCalc.toFixed(2)}${CUSTOM_SIZE_TYPE}`;

  const result = calcMultiplyingValues(
    INITIAL_VALUE,
    BASE,
    RATIO,
    CUSTOM_SIZE_TYPE
  );

  expect(result).toEqual(expectedValue);
});
