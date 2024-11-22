import * as allExports from 'src/themes/Bruttal/Bruttal';

test('should export fonts and theme', () => {
  expect(allExports.BruttalFonts).toBeDefined();
  expect(allExports.BruttalTheme).toBeDefined();
});

test('Bruttal theme snapshot', () => {
  expect(allExports.BruttalTheme).toMatchSnapshot();
});
