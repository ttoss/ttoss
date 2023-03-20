import { BruttalTheme } from '../../src/themes/Bruttal/Bruttal';
import { createTheme } from '../../src';

test('should match BruttalTheme', () => {
  expect(createTheme({})).toEqual(BruttalTheme);
});

test('should change primary color', () => {
  expect(createTheme({ colors: { primary: 'red' } })).toEqual({
    ...BruttalTheme,
    colors: {
      ...BruttalTheme.colors,
      primary: 'red',
    },
  });
});

test('should extend colors', () => {
  expect(createTheme({ colors: { red: 'red' } })).toEqual({
    ...BruttalTheme,
    colors: {
      ...BruttalTheme.colors,
      red: 'red',
    },
  });
});
