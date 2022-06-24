import { babelConfig, defaultConfig } from './babel';

test('should return default config', () => {
  expect(babelConfig()).toEqual(defaultConfig);
});

test('should update plugin', () => {
  expect(
    babelConfig(
      { plugins: ['relay'] },
      {
        arrayMerge: 'overwrite',
      }
    )
  ).toEqual({
    ...defaultConfig,
    plugins: ['relay'],
  });
});

test('should append plugin', () => {
  expect(babelConfig({ plugins: ['relay'] })).toEqual({
    ...defaultConfig,
    plugins: [...defaultConfig.plugins, 'relay'],
  });
});
