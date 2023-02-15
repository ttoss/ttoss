import * as allExports from '../../src';

it('themes and fonts should be exported', () => {
  expect(allExports.createTheme).toBeDefined();

  expect(allExports.BruttalFonts).toBeDefined();
  expect(allExports.BruttalTheme).toBeDefined();
});
