import { defaultConfig, jestConfig } from 'src/jest';

test('should return default config', () => {
  expect(jestConfig()).toEqual(defaultConfig);
});
