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
