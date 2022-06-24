import { defaultConfig, tsupConfig } from './tsup';

test('should return default configuration', () => {
  expect(tsupConfig()).toEqual(defaultConfig);
});

test('should return default configuration with different entrypoint', () => {
  expect(
    tsupConfig(
      {
        entryPoints: ['src/index.tsx'],
      },
      {
        arrayMerge: 'overwrite',
      }
    )
  ).toEqual({ ...defaultConfig, entryPoints: ['src/index.tsx'] });
});
