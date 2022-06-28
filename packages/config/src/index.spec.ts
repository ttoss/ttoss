import * as allConfigs from '.';

it('configs should be exported', () => {
  expect(allConfigs.babelConfig).toBeDefined();
  expect(allConfigs.commitlintConfig).toBeDefined();
  expect(allConfigs.jestConfig).toBeDefined();
  expect(allConfigs.lintstagedConfig).toBeDefined();
  expect(allConfigs.prettierConfig).toBeDefined();
  expect(allConfigs.tsupConfig).toBeDefined();
});
