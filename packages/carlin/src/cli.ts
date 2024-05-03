/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-param-reassign */
import { AWS_DEFAULT_REGION, NAME } from './config';
import { EnvironmentVariables, addGroupToOptions, setEnvVar } from './utils';
import { constantCase, kebabCase } from 'change-case';
import { deployCommand } from './deploy/command';
import { ecsTaskReportCommand } from './deploy/cicd/ecsTaskReportCommand';
import { generateEnvCommand } from './generateEnv/generateEnvCommand';
import { hideBin } from 'yargs/helpers';
import { readConfigFileSync } from '@ttoss/read-config-file';
import AWS from 'aws-sdk';
import deepEqual from 'deep-equal';
import deepMerge from 'deepmerge';
import findUpSync from 'findup-sync';
import path from 'path';
import yargs from 'yargs';

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
    // coerce: coerceSetEnvVar('REGION'),
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
 * `CARLIN`.
 * Example, you can use `carlin deploy --stack-name MyStackName` or
 * `CARLIN_STACK_NAME=MyStackName carlin deploy`.
 */
const getEnv = () => {
  return constantCase(NAME);
};

/**
 * Transformed to method because finalConfig was failing the tests.
 */
export const cli = () => {
  /**
   * All config files merged.
   */
  let finalConfig: any;

  /**
   * If `--config` isn't provided, the algorithm will search for any of these
   * files and use it to retrieve the options:
   *
   * - `carlin.ts`
   * - `carlin.js`
   * - `carlin.yml`
   * - `carlin.yaml`
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
    const names = ['ts', 'js', 'yml', 'yaml', 'json'].map((ext) => {
      return `${NAME}.${ext}`;
    });
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

    const configs = paths.map((p) => {
      return readConfigFileSync({ configFilePath: p }) || {};
    });

    /**
     * Using configs.reverser() to get the most far config first. This way the
     * nearest configs will replace others.
     */
    finalConfig = deepMerge.all(configs.reverse());

    return finalConfig;
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
      });
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
        return readConfigFileSync<any>({ configFilePath });
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
