import { loadTsConfig } from './tsCompile';
import fs from 'fs';
import yaml from 'js-yaml';

type ConfigInput = {
  configFilePath: string;
};

export const readConfigFileSync = <ConfigFile = unknown>({
  configFilePath,
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
    return require(configFilePath);
  }

  if (extension === 'ts') {
    let result = loadTsConfig(configFilePath);
    if (typeof result === 'function') {
      result = result();
    }
    return result as ConfigFile;
  }

  throw new Error('Unsupported config file extension');
};

export const readConfigFile = async <ConfigFile = unknown>({
  configFilePath,
}: ConfigInput): Promise<ConfigFile> => {
  const extension = configFilePath.split('.').pop();

  if (extension === 'ts') {
    let result = loadTsConfig(configFilePath);
    if (typeof result === 'function') {
      result = result();
    }
    result = await Promise.resolve(result);
    return result as ConfigFile;
  }

  return readConfigFileSync({ configFilePath });
};
