/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommandModule, InferredOptionTypes } from 'yargs';
import { addGroupToOptions, getAwsAccountId } from '../utils';
import { deployBaseStackCommand } from './baseStack/command';
import { deployCicdCommand } from './cicd/command';
import { deployCloudFormation, destroyCloudFormation } from './cloudformation';
import { deployLambdaLayerCommand } from './lambdaLayer/command';
import { deployStaticAppCommand } from './staticApp/command';
import { deployVercelCommand } from './vercel/command';
import { getStackName, setPreDefinedStackName } from './stackName';
import { printStackOutputsAfterDeploy } from './cloudformation.core';
import { readDockerfile } from './readDockerfile';
import log from 'npmlog';

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
      'Destroy the deployment. You cannot destroy a deploy with "environment" is defined.',
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
  'lambda-externals': {
    default: [],
    describe: 'Lambda external packages.',
    type: 'array',
  },
  'lambda-input': {
    default: 'src/lambda.ts',
    describe:
      'Lambda input file. This file export all handlers used by the Lambda Functions.',
    type: 'string',
  },
  /**
   * This option has the format:
   *
   * ```ts
   * {
   *  key: string,
   *  value: string,
   *  usePreviousValue: boolean,
   *  resolvedValue: string
   * }[]
   * ```
   */
  parameters: {
    alias: 'p',
    default: [],
    describe:
      'A list of parameters that will be passed to CloudFormation Parameters when deploying.',
  },
  'skip-deploy': {
    alias: 'skip',
    default: false,
    describe: 'Skip deploy.',
    type: 'boolean',
  },
  'stack-name': {
    describe: 'CloudFormation Stack name.',
    type: 'string',
  },
  'template-path': {
    alias: 't',
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
    'carlin deploy --lambda-input src/lambda/index.ts --lambda-externals momentjs',
    "Lambda exists. Don't bundle momentjs.",
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
      describe: 'Type of deployment.',
      type: 'string',
    });

    commands.forEach((command) => {
      return yargsBuilder.command(command as CommandModule);
    });

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
