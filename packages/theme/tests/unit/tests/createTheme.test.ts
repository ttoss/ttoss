import { BruttalTheme } from '../../../src/themes/Bruttal/Bruttal';
import { createTheme } from '../../../src';

test('should match BruttalTheme', () => {
  expect(createTheme({}, BruttalTheme)).toEqual(BruttalTheme);
});

test('should change primary color', () => {
  expect(createTheme({ colors: { primary: 'red' } }, BruttalTheme)).toEqual({
    ...BruttalTheme,
    colors: {
      ...BruttalTheme.colors,
      primary: 'red',
    },
  });
});

test('should extend colors', () => {
  expect(createTheme({ colors: { red: 'red' } }, BruttalTheme)).toEqual({
    ...BruttalTheme,
    colors: {
      ...BruttalTheme.colors,
      red: 'red',
    },
  });
});
