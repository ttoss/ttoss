/* eslint-disable @typescript-eslint/no-explicit-any */
import log from 'npmlog';
import { CommandModule, InferredOptionTypes } from 'yargs';

import { addGroupToOptions, getAwsAccountId } from '../utils';
import { deployBaseStackCommand } from './baseStack/command';
import { deployCicdCommand } from './cicd/command';
import { deployCloudFormation, destroyCloudFormation } from './cloudformation';
import { printStackOutputsAfterDeploy } from './cloudformation.core';
import { deployLambdaLayerCommand } from './lambdaLayer/command';
import { readDockerfile } from './readDockerfile';
import { getStackName, setPreDefinedStackName } from './stackName';
import { deployStaticAppCommand } from './staticApp/command';
import { deployVercelCommand } from './vercel/command';

const logPrefix = 'deploy';

const checkAwsAccountId = async (awsAccountId: string) => {
  try {
    const currentAwsAccountId = await getAwsAccountId();
    if (String(awsAccountId) !== String(currentAwsAccountId)) {
      throw new Error(
        `AWS account id does not match. Current is "${currentAwsAccountId}" but the defined in configuration files is "${awsAccountId}".`
      );
    }
  } catch (error: any) {
    if (error.code === 'CredentialsError') {
      /**
       * No credentials found.
       */
      return;
    }

    log.error(logPrefix, error.message);
    process.exit();
  }
};

const describeDeployCommand: CommandModule = {
  command: 'describe',
  describe: 'Print the outputs of the deployment.',
  handler: async ({ stackName }) => {
    try {
      const newStackName = (stackName as string) || (await getStackName());
      await printStackOutputsAfterDeploy({ stackName: newStackName });
    } catch (error: any) {
      log.info(logPrefix, 'Cannot describe stack. Message: %s', error.message);
    }
  },
};

export const options = {
  'aws-account-id': {
    describe: 'AWS account id associated with the deployment.',
    type: 'string',
  },
  destroy: {
    default: false,
    describe:
      'Destroy the deployment. You cannot destroy a deploy when "environment" is defined.',
    type: 'boolean',
  },
  'lambda-dockerfile': {
    coerce: (arg: string) => {
      return readDockerfile(arg);
    },
    default: 'Dockerfile',
    describe: 'Instructions to create the Lambda image.',
    type: 'string',
  },
  'lambda-image': {
    default: false,
    describe: 'A Lambda image will be created instead using S3.',
    type: 'boolean',
  },
  'lambda-external': {
    default: [],
    describe: 'External modules that will not be bundled in the Lambda code.',
    type: 'array',
  },
  'lambda-entry-points-base-dir': {
    default: 'src',
    describe: 'Base directory for Lambda entry points.',
    type: 'string',
  },
  'lambda-entry-points': {
    default: [],
    describe:
      'This is an array of files that each serve as an input to the bundling algorithm for Lambda functions.',
    type: 'string',
  },
  'lambda-format': {
    choices: ['esm', 'cjs'],
    default: 'esm',
    describe: 'Lambda code format.',
    type: 'string',
  },
  'lambda-outdir': {
    default: 'dist',
    describe: 'Output directory for built Lambda code.',
    type: 'string',
  },
  'lambda-runtime': {
    choices: ['nodejs20.x', 'nodejs22.x', 'nodejs24.x'] as const,
    default: 'nodejs24.x',
    describe: 'Node.js runtime for Lambda functions.',
    type: 'string',
  },
  /**
   * This option has the format to match [CloudFormation parameter](https://docs.aws.amazon.com/AWSCloudFormation/latest/APIReference/API_Parameter.html).
   *
   * ```ts
   * {
   *  key: string,
   *  value: string,
   *  usePreviousValue: boolean,
   *  resolvedValue: string
   * }[]
   * ```
   *
   * For example:
   *
   * ```ts
   * [
   *  {
   *    key: 'key1',
   *    value: 'value1',
   *  },
   *  {
   *    key: 'key2',
   *    value: 'value2',
   *  }
   * ]
   * ```
   *
   * If you want to simplify the usage, you can pass a object with key and value only:
   *
   * ```ts
   * {
   *  key1: 'value1',
   *  key2: 'value2'
   * }
   * ```
   */
  parameters: {
    alias: 'p',
    coerce: (arg: any) => {
      if (Array.isArray(arg)) {
        return arg;
      }

      if (typeof arg === 'object') {
        return Object.entries(arg).map(([key, value]) => {
          return {
            key,
            value,
          };
        });
      }

      return [];
    },
    default: [],
    describe:
      'A list of parameters that will be passed to CloudFormation Parameters when deploying.',
  },
  'skip-deploy': {
    alias: 'skip',
    default: false,
    describe: 'Skip the deploy command.',
    type: 'boolean',
  },
  'stack-name': {
    describe: 'Set the stack name.',
    type: 'string',
  },
  'template-path': {
    alias: 't',
    describe: 'Path to the CloudFormation template.',
    type: 'string',
  },
} as const;

export const examples: ReadonlyArray<[string, string?]> = [
  [
    'carlin deploy -t src/cloudformation.template1.yml',
    'Change the CloudFormation template path.',
  ],
  ['carlin deploy -e Production', 'Set environment.'],
  [
    'carlin deploy --lambda-externals momentjs',
    "Lambda exists. Don't bundle momentjs.",
  ],
  [
    'carlin deploy --lambda-runtime nodejs20.x',
    'Use Node.js 20.x runtime for Lambda functions.',
  ],
  [
    'carlin deploy --destroy --stack-name StackToBeDeleted',
    'Destroy a specific stack.',
  ],
];

export const deployCommand: CommandModule<
  any,
  InferredOptionTypes<typeof options>
> = {
  command: 'deploy [deploy]',
  describe: 'Deploy cloud resources.',
  builder: (yargsBuilder) => {
    yargsBuilder
      .example(examples)
      .options(addGroupToOptions(options, 'Deploy Options'))
      /**
       * Set stack name.
       */
      .middleware(({ stackName }) => {
        if (stackName) {
          setPreDefinedStackName(stackName);
        }
      })
      /**
       * Set lambdaImage if lambdaDockerfile exists.
       */
      .middleware((argv) => {
        if (argv.lambdaDockerfile) {
          Object.assign(argv, {
            lambdaImage: true,
          });
        }
      })
      /**
       * Check AWS account id.
       */
      .middleware(
        async ({
          environments,
          environment,
          awsAccountId: defaultAwsAccountId,
        }) => {
          const envAwsAccountId: string | undefined = (() => {
            return environments && environment && environments[environment]
              ? environments[environment].awsAccountId
              : undefined;
          })();

          if (envAwsAccountId) {
            await checkAwsAccountId(envAwsAccountId);
          }

          if (defaultAwsAccountId) {
            await checkAwsAccountId(defaultAwsAccountId);
          }
        }
      )
      .middleware(({ skipDeploy }) => {
        if (skipDeploy) {
          log.warn(
            logPrefix,
            "Skip deploy flag is true, then the deploy command wasn't executed."
          );
          process.exit(0);
        }
      })
      /**
       * Raise error if old options are used.
       */
      .middleware(({ lambdaExternals, lambdaInput }) => {
        if (lambdaInput) {
          throw new Error(
            'Option "lambdaInput" was removed. Please use "lambdaEntryPoints" instead.'
          );
        }

        if (lambdaExternals) {
          throw new Error(
            'Option "lambdaExternals" was removed. Please use "lambdaExternal" instead.'
          );
        }
      });

    const commands = [
      deployLambdaLayerCommand,
      describeDeployCommand,
      deployBaseStackCommand,
      deployStaticAppCommand,
      deployCicdCommand,
      deployVercelCommand,
    ];

    yargsBuilder.positional('deploy', {
      choices: commands.map(({ command }) => {
        return command as string;
      }),
      describe: 'Deploy command.',
      type: 'string',
    });

    for (const command of commands) {
      yargsBuilder.command(command as CommandModule);
      continue;
    }

    return yargsBuilder;
  },
  handler: ({ destroy, ...rest }) => {
    if (destroy) {
      destroyCloudFormation();
    } else {
      deployCloudFormation(rest as any);
    }
  },
};
