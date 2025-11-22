import fs from 'node:fs';

import yaml from 'js-yaml';

import { loadConfig } from './loadConfig';

type ConfigInput = {
  configFilePath: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any;
};

export const readConfigFileSync = <ConfigFile = unknown>({
  configFilePath,
  options,
}: ConfigInput): ConfigFile => {
  const extension = configFilePath.split('.').pop();

  if (extension === 'yaml' || extension === 'yml') {
    const file = fs.readFileSync(configFilePath, 'utf8');
    return yaml.load(file) as ConfigFile;
  }

  if (extension === 'json') {
    const file = fs.readFileSync(configFilePath, 'utf8');
    return JSON.parse(file);
  }

  if (extension === 'js') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(configFilePath);
  }

  if (extension === 'ts') {
    let result = loadConfig(configFilePath);
    if (typeof result === 'function') {
      result = result(options);
    }
    return result as ConfigFile;
  }

  throw new Error('Unsupported config file extension: ' + extension);
};

export const readConfigFile = async <ConfigFile = unknown>({
  configFilePath,
  options,
}: ConfigInput): Promise<ConfigFile> => {
  const extension = configFilePath.split('.').pop();

  if (extension === 'ts') {
    let result = loadConfig(configFilePath);
    if (typeof result === 'function') {
      result = result(options);
    }
    result = await Promise.resolve(result);
    return result as ConfigFile;
  }

  return readConfigFileSync({ configFilePath, options });
};
