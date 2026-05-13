/* eslint-disable @typescript-eslint/no-explicit-any */

import 'dotenv/config';

import path from 'node:path';

import { readConfigFileSync } from '@ttoss/read-config-file';
import AWS from 'aws-sdk';
import { constantCase, kebabCase } from 'change-case';
import deepEqual from 'deep-equal';
import deepMerge from 'deepmerge';
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
 * Transformed to method because finalConfig was failing the tests because as
 * function we encapsulate the logic and it is not executed on the import.
 */
export const cli = () => {
  /**
   * All config files merged.
   */
  let finalConfig: any;

  const getConfig = () => {
    return (finalConfig = readConfigFiles());
  };

  /**
   * We architected Carlin to work with multiple environments. The
   * `environments` option is an object that contains specific values for
   * each environment. For instance, you may have a `Production` and a
   * `Staging` environment with different values for the same option,
   * like `awsAccountId`. The `environment` option is a string that
   * represents the current environment. The `environments` option is an
   * object that contains the values for each environment. The values of
   * the current environment will be merged with the default values.
   *
   * For example, if you have the following config file:
   *
   * ```yaml
   * awsAccountId: 111111111111
   *
   * environments:
   *  Production:
   *    awsAccountId: 222222222222
   *
   *  Staging:
   *    awsAccountId: 333333333333
   * ```
   *
   * And you run the following command:
   *
   * ```sh
   * carlin deploy --environment Production
   * ```
   *
   * The final `awsAccountId` value will be `222222222222`. If you run the
   * following command:
   *
   * ```sh
   * carlin deploy --environment Staging
   * ```
   *
   * The final `awsAccountId` value will be `333333333333`. If you run the
   * deploy command without the `--environment` option, the final value
   * will be `111111111111`.
   *
   * `environments` is great to work on CI/CD pipelines. You can set the
   * `environment` value as an environment variable and Carlin will use the
   * values from the config file.
   */
  const handleEnvironments = (argv: any, { parsed }: any) => {
    const { environment, environments } = argv;

    if (environment && environments && environments[environment as string]) {
      for (const [key, value] of Object.entries(environments[environment])) {
        /**
         * The case where argv[key] must not have the environment value is
         * when such value is passed as option via CLI. For instance,
         *
         * $ carlin deploy --stack-name SomeName
         *
         * SomeName must be used as stack name independently of the
         * environment values https://github.com/ttoss/carlin/issues/13.
         *
         * Three cases set argv:
         *
         * 1. Default.
         * 2. Config file.
         * 3. CLI
         *
         * - Case 1 we determine if the `parsed.defaulted` is true.
         * - Case 2 we determine if `argv[key] === finalConfig[key]`.
         * - Case 3 if the two above are falsy.
         */
        const isKeyFromCli = (() => {
          const kebabCaseKey = kebabCase(key);

          /**
           * Case 1.
           * Fixes #16 https://github.com/ttoss/carlin/issues/16
           */
          if (parsed?.defaulted?.[kebabCaseKey]) {
            return false;
          }

          /**
           * Case 2.
           *
           * Fixes #13 https://github.com/ttoss/carlin/issues/13
           *
           * Deep equal because arg can be an array or object.
           */
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

  return (
    yargs(hideBin(process.argv))
      /**
       * It can't be full strict because options may overlap among carlin config
       * files.
       */
      .strictCommands()
      .scriptName(NAME)
      /**
       * https://yargs.js.org/docs/#api-reference-envprefix
       */
      .env(getEnv())
      .options(addGroupToOptions(options, 'Common Options'))
      /**
       * Middleware to set the `environment` option equals to the
       * process.env.ENVIRONMENT if it exists and `environment` option
       * is not provided.
       */
      .middleware((argv) => {
        const finalEnvironment = argv.environment || process.env.ENVIRONMENT;
        if (finalEnvironment) {
          setEnvVar('ENVIRONMENT', finalEnvironment);
          const envKeys = ['environment', ...options.environment.alias];
          const envEntries = envKeys.map((key) => {
            return [key, finalEnvironment];
          });
          Object.assign(argv, Object.fromEntries(envEntries));
        }
      })
      .middleware(handleEnvironments as any)
      /**
       * Sometimes "environments" can be written as "environment" on config file.
       * For instance, you may have a config file with the following content:
       *
       * ```yaml
       * environment:
       *  Production:
       *    awsAccountId: 222222222222
       * ```
       *
       * The middleware below will throw an error if that happens.
       */
      .middleware(({ environment }) => {
        if (!['string', 'undefined'].includes(typeof environment)) {
          throw new Error(
            `environment type is invalid. The value: ${JSON.stringify(
              environment
            )}`
          );
        }
      })
      /**
       * Set AWS region.
       */
      .middleware(({ region }) => {
        AWS.config.region = region;
        setEnvVar('REGION', region);
      })
      /**
       * https://yargs.js.org/docs/#api-reference-pkgconfkey-cwd
       */
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
      .help()
  );
};
