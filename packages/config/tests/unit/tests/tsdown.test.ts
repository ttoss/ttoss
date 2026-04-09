import { defaultConfig, tsdownConfig } from 'src/tsdown';

test('should return default configuration', () => {
  expect(tsdownConfig()).toEqual(defaultConfig);
});

test('should return default configuration with different entrypoint', () => {
  expect(
    tsdownConfig(
      {
        entry: ['src/index.tsx'],
      },
      {
        arrayMerge: 'overwrite',
      }
    )
  ).toEqual({ ...defaultConfig, entry: ['src/index.tsx'] });
});
