import * as allExports from '../../src/themes/Bruttal/Bruttal';

it('should export fonts and theme', () => {
  expect(allExports.BruttalFonts).toBeDefined();
  expect(allExports.BruttalTheme).toBeDefined();
});
