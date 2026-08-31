import {
  defaultConfig,
  jestConfig,
  jestE2EConfig,
  jestUnitConfig,
} from 'src/jest';

test('should return default config', () => {
  expect(jestConfig()).toEqual(defaultConfig);
});

test('should map css files in unit config', () => {
  const config = jestUnitConfig();
  expect(config.moduleNameMapper['\\.(css|less|scss|sass)$']).toBe(
    'identity-obj-proxy'
  );
});

test('should map css files in e2e config', () => {
  const config = jestE2EConfig();
  expect(config.moduleNameMapper['\\.(css|less|scss|sass)$']).toBe(
    'identity-obj-proxy'
  );
});

test('should raise testTimeout above the 5s jest default', () => {
  expect(defaultConfig.testTimeout).toBe(30_000);
  expect(jestUnitConfig().testTimeout).toBe(30_000);
  expect(jestE2EConfig().testTimeout).toBe(30_000);
});

test('should let a package override the default testTimeout', () => {
  expect(jestUnitConfig({ testTimeout: 120_000 }).testTimeout).toBe(120_000);
});
