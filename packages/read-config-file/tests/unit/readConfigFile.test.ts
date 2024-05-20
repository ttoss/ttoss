import { readConfigFile, readConfigFileSync } from '../../src';
import path from 'node:path';

test.each([
  'config.js',
  'config.json',
  'config.ts',
  'config.yaml',
  'config.yml',
  'configAsyncFunction.ts',
  'configFunction.ts',
])('should read config file %s', async (configName) => {
  const configFilePath = path.resolve(__dirname, `../fixtures/${configName}`);
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
  const configFilePath = path.resolve(__dirname, `../fixtures/${configName}`);
  const config = readConfigFileSync({ configFilePath });
  expect(config).toEqual({
    parameters: {
      foo: 'bar',
      baz: 'qux',
    },
  });
});

test('read config when importing package', async () => {
  const configFilePath = path.resolve(
    __dirname,
    '../fixtures/importingPackage.ts'
  );
  const config = await readConfigFile({ configFilePath });
  expect(config).toEqual({
    sum: 20,
  });
});

test('add options to config function', async () => {
  const configFilePath = path.resolve(
    __dirname,
    '../fixtures/configFunctionWithOptions.ts'
  );
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
