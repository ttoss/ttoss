/* eslint-disable @typescript-eslint/no-explicit-any */

import path from 'node:path';

import { readConfigFileSync } from '@ttoss/read-config-file';
import AWS from 'aws-sdk';
import { constantCase, kebabCase } from 'change-case';
import deepEqual from 'deep-equal';
import deepMerge from 'deepmerge';
import dotenv from 'dotenv';
import findUpSync from 'findup-sync';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { AWS_DEFAULT_REGION, NAME } from './config';
import { ecsTaskReportCommand } from './deploy/cicd/ecsTaskReportCommand';
import { deployCommand } from './deploy/command';
import { generateEnvCommand } from './generateEnv/generateEnvCommand';
import type { EnvironmentVariables } from './utils';
import { addGroupToOptions, setEnvVar } from './utils';

const coerceSetEnvVar = (env: EnvironmentVariables) => {
  return (value: any) => {
    setEnvVar(env, value);
    return value;
  };
};

export const options = {
  branch: {
    coerce: coerceSetEnvVar('BRANCH'),
    require: false,
    type: 'string',
  },
  config: {
    alias: 'c',
    describe:
      'Path to config file. You can create a config file and set all options there. Valid extensions: .js, .json, .ts, .yml, or .yaml.',
    require: false,
    type: 'string',
  },
  environment: {
    alias: ['e', 'env'],
    coerce: coerceSetEnvVar('ENVIRONMENT'),
    type: 'string',
  },
  environments: {},
  project: {
    coerce: coerceSetEnvVar('PROJECT'),
    require: false,
    type: 'string',
  },
  region: {
    alias: 'r',
    default: AWS_DEFAULT_REGION,
    describe: 'AWS region.',
    type: 'string',
  },
} as const;

/**
 * You can also provide the options creating a property name `carlin`
 * inside your `package.json`.
 */
const getPkgConfig = () => {
  return NAME;
};

/**
 * You can set the options as environment variables matching the prefix
 * `CARLIN`. The examples below are equivalent:
 *
 * - `carlin deploy --stack-name MyStackName`
 * - `CARLIN_STACK_NAME=MyStackName carlin deploy`
 *
 * `ENVIRONMENT` is a special case because it is used to set the `environment`
 * option, as well `CARLIN_ENVIRONMENT`. The examples below are
 * equivalent:
 *
 * - `carlin deploy --environment Production`
 * - `CARLIN_ENVIRONMENT=Production carlin deploy`
 * - `ENVIRONMENT=Production carlin deploy`
 */
const getEnv = () => {
  return constantCase(NAME);
};

const normalizeConfigOptionValue = ({ value }: { value?: string }) => {
  if (!value || value === 'undefined') {
    return undefined;
  }

  return value;
};

const getArgValue = ({ args, names }: { args: string[]; names: string[] }) => {
  for (const [index, arg] of args.entries()) {
    const equalSignName = names.find((name) => {
      return arg.startsWith(`${name}=`);
    });

    if (equalSignName) {
      return normalizeConfigOptionValue({
        value: arg.slice(equalSignName.length + 1),
      });
    }

    if (names.includes(arg)) {
      return normalizeConfigOptionValue({ value: args[index + 1] });
    }
  }

  return undefined;
};

export const getConfigFileOptions = ({
  args = hideBin(process.argv),
}: { args?: string[] } = {}) => {
  return {
    branch:
      getArgValue({ args, names: ['--branch'] }) || process.env.CARLIN_BRANCH,
    environment:
      getArgValue({ args, names: ['--environment', '--env', '-e'] }) ||
      process.env.CARLIN_ENVIRONMENT ||
      process.env.ENVIRONMENT,
    project:
      getArgValue({ args, names: ['--project'] }) || process.env.CARLIN_PROJECT,
  };
};

const getConfigFileNames = () => {
  return ['ts', 'js', 'yml', 'yaml', 'json'].map((ext) => {
    return `${NAME}.${ext}`;
  });
};

const findConfigFilePaths = () => {
  const names = getConfigFileNames();
  const paths: string[] = [];
  let currentPath = process.cwd();
  let findUpPath: string | null;

  do {
    findUpPath = findUpSync(names, { cwd: currentPath });
    if (findUpPath) {
      currentPath = path.resolve(findUpPath, '../..');
      paths.push(findUpPath);
    }
  } while (findUpPath);

  return paths;
};

/**
 * If `--config` isn't provided, Carlin searches for config files named
 * `carlin.ts`, `carlin.js`, `carlin.yml`, `carlin.yaml`, or `carlin.json`.
 * In monorepos, files from parent directories are merged first, so the nearest
 * config file takes precedence over shared root configuration.
 */
const readConfigFiles = () => {
  const configs = findConfigFilePaths().map((configFilePath) => {
    return (
      readConfigFileSync({
        configFilePath,
        options: getConfigFileOptions(),
      }) || {}
    );
  });

  return deepMerge.all(configs.reverse());
};

/**
 * Load the appropriate .env file. If an environment is specified (e.g. `-e
 * Production`) and a `.env.Production` file exists, load only that file so
 * environment-specific values are authoritative and nothing from a generic
 * `.env` can bleed through. Fall back to `.env` when no environment-specific
 * file is found or when no environment is specified.
 */
export const loadDotEnv = () => {
  const { environment } = getConfigFileOptions();
  if (environment) {
    const result = dotenv.config({
      path: path.resolve(process.cwd(), `.env.${environment}`),
    });
    if (result.error) {
      dotenv.config();
    }
  } else {
    dotenv.config();
  }
};

const syncEnvironmentOption = (argv: any) => {
  const finalEnvironment = argv.environment || process.env.ENVIRONMENT;
  if (finalEnvironment) {
    setEnvVar('ENVIRONMENT', finalEnvironment);
    const envKeys = ['environment', ...options.environment.alias];
    const envEntries = envKeys.map((key) => {
      return [key, finalEnvironment];
    });
    Object.assign(argv, Object.fromEntries(envEntries));
  }
};

/**
 * Transformed to method because finalConfig was failing the tests because as
 * function we encapsulate the logic and it is not executed on the import.
 */
export const cli = () => {
  loadDotEnv();

  let finalConfig: any;

  const getConfig = () => {
    return (finalConfig = readConfigFiles());
  };

  const handleEnvironments = (argv: any, { parsed }: any) => {
    const { environment, environments } = argv;

    if (environment && environments && environments[environment as string]) {
      for (const [key, value] of Object.entries(environments[environment])) {
        const isKeyFromCli = (() => {
          const kebabCaseKey = kebabCase(key);

          if (parsed?.defaulted?.[kebabCaseKey]) {
            return false;
          }

          if (deepEqual(argv[key], finalConfig[key])) {
            return false;
          }

          return true;
        })();

        if (!isKeyFromCli) {
          argv[key] = value;
        }
      }
    }
  };

  return yargs(hideBin(process.argv))
    .strictCommands()
    .scriptName(NAME)
    .env(getEnv())
    .options(addGroupToOptions(options, 'Common Options'))
    .middleware(syncEnvironmentOption)
    .middleware(handleEnvironments as any)
    .middleware(({ environment }) => {
      if (!['string', 'undefined'].includes(typeof environment)) {
        throw new Error(
          `environment type is invalid. The value: ${JSON.stringify(
            environment
          )}`
        );
      }
    })
    .middleware(({ region }) => {
      AWS.config.region = region;
      setEnvVar('REGION', region);
    })
    .pkgConf(getPkgConfig())
    .config(getConfig())
    .config('config', (configFilePath: string) => {
      return readConfigFileSync<any>({
        configFilePath,
        options: getConfigFileOptions(),
      });
    })
    .command({
      command: 'print-args',
      describe: false,
      handler: (argv) => {
        // eslint-disable-next-line no-console
        return console.log(JSON.stringify(argv, null, 2));
      },
    })
    .command(deployCommand)
    .command(ecsTaskReportCommand)
    .command(generateEnvCommand)
    .epilogue(
      'For more information, read our docs at https://ttoss.dev/docs/carlin/'
    )
    .help();
};
