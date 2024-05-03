import { readConfigFile, readConfigFileSync } from '../../src';
import path from 'path';

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
