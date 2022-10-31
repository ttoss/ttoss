import * as allConfigs from '.';

it('themes and fonts should be exported', () => {
  expect(allConfigs.BruttalFonts).toBeDefined();
  expect(allConfigs.BruttalTheme).toBeDefined();
  expect(allConfigs.DefaultFonts).toBeDefined();
  expect(allConfigs.DefaultTheme).toBeDefined();
});
