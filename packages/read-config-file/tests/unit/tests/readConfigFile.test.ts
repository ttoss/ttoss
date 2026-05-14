import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { readConfigFile, readConfigFileSync } from 'src/index';

const getConfigFilePath = (configName: string) => {
  return path.resolve(__dirname, `../../fixtures/${configName}`);
};

const createTempTsConfigFile = () => {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'read-config-file-tests-')
  );
  return path.join(tempDir, `config-${Date.now()}.ts`);
};

const writeConfigVersion = ({
  configFilePath,
  value,
}: {
  configFilePath: string;
  value: string;
}) => {
  fs.writeFileSync(
    configFilePath,
    `export default { parameters: { foo: '${value}', baz: 'qux' } };`,
    'utf8'
  );
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

test('should reload updated ts config between async reads', async () => {
  const configFilePath = createTempTsConfigFile();

  try {
    writeConfigVersion({ configFilePath, value: 'v1' });
    const firstConfig = await readConfigFile<{
      parameters: { foo: string; baz: string };
    }>({ configFilePath });

    writeConfigVersion({ configFilePath, value: 'v2' });
    const secondConfig = await readConfigFile<{
      parameters: { foo: string; baz: string };
    }>({ configFilePath });

    expect(firstConfig.parameters.foo).toBe('v1');
    expect(secondConfig.parameters.foo).toBe('v2');
  } finally {
    fs.rmSync(path.dirname(configFilePath), { force: true, recursive: true });
  }
});

test('should reload updated ts config between sync reads', () => {
  const configFilePath = createTempTsConfigFile();

  try {
    writeConfigVersion({ configFilePath, value: 'v1' });
    const firstConfig = readConfigFileSync<{
      parameters: { foo: string; baz: string };
    }>({ configFilePath });

    writeConfigVersion({ configFilePath, value: 'v2' });
    const secondConfig = readConfigFileSync<{
      parameters: { foo: string; baz: string };
    }>({ configFilePath });

    expect(firstConfig.parameters.foo).toBe('v1');
    expect(secondConfig.parameters.foo).toBe('v2');
  } finally {
    fs.rmSync(path.dirname(configFilePath), { force: true, recursive: true });
  }
});
