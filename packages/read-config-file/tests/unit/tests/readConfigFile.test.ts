import path from 'node:path';

import { readConfigFile, readConfigFileSync } from 'src/index';

const getConfigFilePath = (configName: string) => {
  return path.resolve(__dirname, `../../fixtures/${configName}`);
};

test.each([
  'config.js',
  'config.json',
  'config.ts',
  'config.yaml',
  'config.yml',
  'configAsyncFunction.ts',
  'configFunction.ts',
])('should read config file %s', async (configName) => {
  const configFilePath = getConfigFilePath(configName);
  const config = await readConfigFile({ configFilePath });
  expect(config).toEqual({
    parameters: {
      foo: 'bar',
      baz: 'qux',
    },
  });
});

test.each([
  'config.js',
  'config.json',
  'config.ts',
  'config.yaml',
  'config.yml',
  'configFunction.ts',
])('should read config file sync %s', (configName) => {
  const configFilePath = getConfigFilePath(configName);
  const config = readConfigFileSync({ configFilePath });
  expect(config).toEqual({
    parameters: {
      foo: 'bar',
      baz: 'qux',
    },
  });
});

test('read config when importing package', async () => {
  const configFilePath = getConfigFilePath('importingPackage.ts');
  const config = await readConfigFile({ configFilePath });
  expect(config).toEqual({
    sum: 20,
  });
});

test('add options to config function', async () => {
  const configFilePath = getConfigFilePath('configFunctionWithOptions.ts');
  const config = await readConfigFile({
    configFilePath,
    options: { foo: 'bar2', baz: 'qux2' },
  });
  expect(config).toEqual({
    parameters: {
      foo: 'bar2',
      baz: 'qux2',
    },
  });
});
