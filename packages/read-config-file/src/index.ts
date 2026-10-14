import fs from 'node:fs';

import {
  binaryTag,
  CORE_SCHEMA,
  load as loadYaml,
  mergeTag,
  omapTag,
  pairsTag,
  setTag,
  timestampTag,
} from 'js-yaml';

import { loadConfig } from './loadConfig';

/**
 * js-yaml 5 defaults to the plain YAML 1.2 Core schema. Extend it with the
 * tags js-yaml 4's `DEFAULT_SCHEMA` supported (merge keys `<<`, timestamps,
 * binary, omap, pairs and set) so existing YAML config files keep parsing the
 * same way.
 */
const YAML_SCHEMA = CORE_SCHEMA.withTags(
  mergeTag,
  timestampTag,
  binaryTag,
  omapTag,
  pairsTag,
  setTag
);

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
    return loadYaml(file, { schema: YAML_SCHEMA }) as ConfigFile;
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
