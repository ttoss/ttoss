import { defaultConfig, lintstagedConfig } from 'src/lintstaged';

test('should return default configuration', () => {
  expect(lintstagedConfig()).toEqual(defaultConfig);
});

test('should append a config', () => {
  expect(
    lintstagedConfig({
      '.js': 'eslint --fix',
    })
  ).toEqual({ ...defaultConfig, '.js': 'eslint --fix' });
});
