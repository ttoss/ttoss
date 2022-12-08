/* eslint-disable no-param-reassign */
import * as yargs from 'yargs';
import { AWS_DEFAULT_REGION, NAME } from './config';
import {
  EnvironmentVariables,
  addGroupToOptions,
  readObjectFile,
  setEnvVar,
} from './utils';
import { constantCase, paramCase } from 'change-case';
import { deployCommand } from './deploy/command';
import { ecsTaskReportCommand } from './deploy/cicd/ecsTaskReportCommand';
import { findUpSync } from 'find-up';
import { generateEnvCommand } from './generateEnv/generateEnvCommand';
import AWS from 'aws-sdk';
import deepEqual from 'deep-equal';
import deepMerge from 'deepmerge';
import path from 'path';

const coerceSetEnvVar = (env: EnvironmentVariables) => {
  return (value: any) => {
    if (value) {
      setEnvVar(env, value);
    }
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
    // coerce: coerceSetEnvVar('REGION'),
    default: AWS_DEFAULT_REGION,
    describe: 'AWS region.',
    type: 'string',
  },
} as const;

/**
 * You can also provide the options creating a property name `carlin`
 * inside your `package.json`. [See Yargs reference](https://yargs.js.org/docs/#api-reference-pkgconfkey-cwd).
 */
const getPkgConfig = () => {
  return NAME;
};

/**
 * All options can be passed as environment variables matching the prefix
 * `CARLIN`. See [Yargs reference](https://yargs.js.org/docs/#api-reference-envprefix).
 * Example, we may use `carlin deploy --stack-name StackName` or
 * `CARLIN_STACK_NAME=StackName carlin deploy`.
 */
const getEnv = () => {
  return constantCase(NAME);
};

/**
 * Transformed to method because finalConfig was failing the tests.
 */
const cli = () => {
  /**
   * All config files merged.
   */
  let finalConfig: any;

  /**
   * If `--config` isn't provided, the algorithm will search for any of these
   * files and use it to retrieve the options:
   *
   * - `carlin.js`
   * - `carlin.ts`
   * - `carlin.yaml`
   * - `carlin.yml`
   * - `carlin.json`
   *
   * The algorithm also make a find up path to search for other config files
   * that may exist in parent directories. If find more than one file, they'll
   * be merged, in such a way that the files nearest from `process.cwd()` will
   * take the precedence at the merging.
   *
   * This is useful if you have a monorepo and have shared and specific
   * configuration. For instance, you may have a config inside `packages/app/`
   * folder with the config below:
   *
   * ```yaml
   * stackName: MyMonorepoApp
   * region: us-east-2
   * ```
   *
   * And on the root of your monorepo:
   *
   * ```yaml
   * awsAccountId: 123456789012
   * region: us-east-1
   * ```
   *
   * The result options that will be passed to the commands executed on
   * `packages/app/` will be:
   *
   * ```yaml
   * awsAccountId: 123456789012
   * stackName: MyMonorepoApp
   * region: us-east-2
   * ```
   */
  const getConfig = () => {
    const names = ['js', 'yml', 'yaml', 'json', 'ts'].map((ext) => {
      return `${NAME}.${ext}`;
    });
    const paths = [];
    let currentPath = process.cwd();
    let findUpPath: string | undefined;

    do {
      findUpPath = findUpSync(names, { cwd: currentPath });
      if (findUpPath) {
        currentPath = path.resolve(findUpPath, '../..');
        paths.push(findUpPath);
      }
    } while (findUpPath);

    const configs = paths.map((p) => {
      return readObjectFile({ path: p }) || {};
    });

    /**
     * Using configs.reverser() to get the most far config first. This way the
     * nearest configs will replace others.
     */
    finalConfig = deepMerge.all(configs.reverse());

    return finalConfig;
  };

  return (
    yargs
      /**
       * It can't be full strict because options may overlap among carlin config
       * files.
       */
      .strictCommands()
      .scriptName(NAME)
      .env(getEnv())
      .options(addGroupToOptions(options, 'Common Options'))
      .middleware(((argv: any, { parsed }: any) => {
        const { environment, environments } = argv;

        /**
         * Create final options with environment and environments.
         */
        if (
          environment &&
          environments &&
          environments[environment as string]
        ) {
          Object.entries(environments[environment]).forEach(([key, value]) => {
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
             * - Case 1 we determine if the parsed.defaulted is true.
             * - Case 2 we determine if `argv[key] === finalConfig[key]`.
             * - Case 3 if the two above are falsy.
             */
            const isKeyFromCli = (() => {
              const paramCaseKey = paramCase(key);

              /**
               * Case 1.
               * Fixes #16 https://github.com/ttoss/carlin/issues/16
               */
              if (parsed?.defaulted?.[paramCaseKey]) {
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
          });
        }
      }) as any)
      /**
       * Sometimes "environments" can be written as "environment" on config file.
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
      .pkgConf(getPkgConfig())
      .config(getConfig())
      .config('config', (configPath: string) => {
        return readObjectFile({ path: configPath });
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

export default cli;
