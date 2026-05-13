export type CarlinParameterValue = string | number | undefined;

export type CarlinParameter = {
  key: string;
  value?: string | number;
  usePreviousValue?: boolean;
  resolvedValue?: string;
};

export type CarlinParameters =
  | CarlinParameter[]
  | Record<string, CarlinParameterValue>;

export type CarlinConfigContext = {
  branch?: string;
  environment?: string;
  project?: string;
};

export type CarlinConfig = {
  parameters?: CarlinParameters;
  environments?: Record<string, CarlinConfig>;
  [key: string]: unknown;
};

export type CarlinConfigFactory<Config extends CarlinConfig = CarlinConfig> = (
  context: CarlinConfigContext
) => Config | Promise<Config>;

export type RequiredEnvOptions = {
  name: string;
  message?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isPromise = <Value>(
  value: Value | Promise<Value>
): value is Promise<Value> => {
  return isRecord(value) && typeof value.then === 'function';
};

const getConfigRecord = ({
  config,
  path,
}: {
  config: unknown;
  path: string;
}) => {
  if (!isRecord(config)) {
    throw new Error(`${path} must resolve to an object.`);
  }

  return config as CarlinConfig;
};

const assertParameterValue = ({
  key,
  path,
  usePreviousValue,
  value,
}: {
  key: string;
  path: string;
  usePreviousValue?: boolean;
  value: unknown;
}) => {
  if (usePreviousValue) {
    return;
  }

  if (value === undefined || value === null || value === '') {
    throw new Error(`${path}.${key} must have a value.`);
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`${path}.${key} must be a string or number.`);
  }
};

const validateParameterArray = ({
  parameters,
  path,
}: {
  parameters: unknown[];
  path: string;
}) => {
  for (const [index, parameter] of parameters.entries()) {
    if (!isRecord(parameter)) {
      throw new Error(`${path}[${index}] must be an object.`);
    }

    if (typeof parameter.key !== 'string' || parameter.key.length === 0) {
      throw new Error(`${path}[${index}].key must be a non-empty string.`);
    }

    assertParameterValue({
      key: parameter.key,
      path,
      usePreviousValue: parameter.usePreviousValue === true,
      value: parameter.value,
    });
  }
};

const validateParameterRecord = ({
  parameters,
  path,
}: {
  parameters: Record<string, unknown>;
  path: string;
}) => {
  for (const [key, value] of Object.entries(parameters)) {
    assertParameterValue({ key, path, value });
  }
};

const validateParameters = ({
  parameters,
  path,
}: {
  parameters: unknown;
  path: string;
}) => {
  if (parameters === undefined) {
    return;
  }

  if (Array.isArray(parameters)) {
    validateParameterArray({ parameters, path });
    return;
  }

  if (isRecord(parameters)) {
    validateParameterRecord({ parameters, path });
    return;
  }

  throw new Error(`${path} must be an object or an array.`);
};

const validateConfig = <Config extends CarlinConfig>({
  config,
  path,
}: {
  config: unknown;
  path: string;
}) => {
  const pendingConfigs = [{ config, path }];
  const configRecord = getConfigRecord({ config, path });

  for (const pendingConfig of pendingConfigs) {
    const currentConfig = getConfigRecord(pendingConfig);

    validateParameters({
      parameters: currentConfig.parameters,
      path: `${pendingConfig.path}.parameters`,
    });

    if (currentConfig.environments === undefined) {
      continue;
    }

    if (!isRecord(currentConfig.environments)) {
      throw new Error(`${pendingConfig.path}.environments must be an object.`);
    }

    for (const [environment, environmentConfig] of Object.entries(
      currentConfig.environments
    )) {
      pendingConfigs.push({
        config: environmentConfig,
        path: `${pendingConfig.path}.environments.${environment}`,
      });
    }
  }

  return configRecord as Config;
};

export function defineConfig<Config extends CarlinConfig>(
  config: Config
): Config;
export function defineConfig<Config extends CarlinConfig>(
  config: CarlinConfigFactory<Config>
): CarlinConfigFactory<Config>;
export function defineConfig<Config extends CarlinConfig>(
  config: Config | CarlinConfigFactory<Config>
) {
  if (typeof config === 'function') {
    return (context: CarlinConfigContext) => {
      const resolvedConfig = config(context);

      if (isPromise(resolvedConfig)) {
        return resolvedConfig.then((asyncConfig) => {
          return validateConfig({ config: asyncConfig, path: 'config' });
        });
      }

      return validateConfig({ config: resolvedConfig, path: 'config' });
    };
  }

  return validateConfig({ config, path: 'config' });
}

export const requiredEnv = ({ name, message }: RequiredEnvOptions) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      message || `Missing required environment variable: ${name}`
    );
  }

  return value;
};
