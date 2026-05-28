import { defaultConfig, tsupConfig } from 'src/tsup';

test('should return default configuration', () => {
  expect(tsupConfig()).toEqual(defaultConfig);
});

test('should return default configuration with different entrypoint', () => {
  expect(
    tsupConfig(
      {
        entry: ['src/index.tsx'],
      },
      {
        arrayMerge: 'overwrite',
      }
    )
  ).toEqual({ ...defaultConfig, entry: ['src/index.tsx'] });
});
