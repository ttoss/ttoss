import * as allConfigs from '.';

it('themes and fonts should be exported', () => {
  expect(allConfigs.bruttalFonts).toBeDefined();
  expect(allConfigs.bruttalTheme).toBeDefined();
  expect(allConfigs.defaultFonts).toBeDefined();
  expect(allConfigs.defaultTheme).toBeDefined();
});
