import * as allConfigs from 'src/index';

test('configs should be exported', () => {
  expect(allConfigs.babelConfig).toBeDefined();
  expect(allConfigs.commitlintConfig).toBeDefined();
  expect(allConfigs.jestConfig).toBeDefined();
  expect(allConfigs.jestE2EConfig).toBeDefined();
  expect(allConfigs.jestRootConfig).toBeDefined();
  expect(allConfigs.jestUnitConfig).toBeDefined();
  expect(allConfigs.lintstagedConfig).toBeDefined();
  expect(allConfigs.prettierConfig).toBeDefined();
  expect(allConfigs.tsupConfig).toBeDefined();
});
