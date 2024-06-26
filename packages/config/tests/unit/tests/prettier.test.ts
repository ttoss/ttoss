import { defaultConfig, prettierConfig } from 'src/prettier';

test('should return default configuration', () => {
  expect(prettierConfig()).toEqual(defaultConfig);
});

test('should append config', () => {
  expect(
    prettierConfig({
      printWidth: 100,
    })
  ).toEqual({ ...defaultConfig, printWidth: 100 });
});
