/* eslint-disable @typescript-eslint/no-explicit-any */
import log from 'npmlog';
import { Command } from 'commander';

import { getAwsAccountId } from '../utils';
import { deployCloudFormation, destroyCloudFormation } from './cloudformation';
import { printStackOutputsAfterDeploy } from './cloudformation.core';
import { readDockerfile } from './readDockerfile';
import { getStackName, setPreDefinedStackName } from './stackName';

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

/**
 * Process parameters option - convert object format to array format if needed
 */
const processParameters = (params: any): any[] => {
  if (Array.isArray(params)) {
    return params;
  }

  if (typeof params === 'object' && params !== null) {
    return Object.entries(params).map(([key, value]) => {
      return { key, value };
    });
  }

  return [];
};

/**
 * Pre-action hook to handle deploy-specific middleware
 */
const handleDeployPreAction = async (opts: any) => {
  // Set stack name
  if (opts.stackName) {
    setPreDefinedStackName(opts.stackName);
  }

  // Set lambdaImage if lambdaDockerfile exists
  if (opts.lambdaDockerfile) {
    opts.lambdaImage = true;
  }

  // Check AWS account id
  const { environments, environment, awsAccountId: defaultAwsAccountId } = opts;

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

  // Skip deploy if flag is set
  if (opts.skipDeploy) {
    log.warn(
      logPrefix,
      "Skip deploy flag is true, then the deploy command wasn't executed."
    );
    process.exit(0);
  }

  // Raise error if old options are used
  if (opts.lambdaInput) {
    throw new Error(
      'Option "lambdaInput" was removed. Please use "lambdaEntryPoints" instead.'
    );
  }

  if (opts.lambdaExternals) {
    throw new Error(
      'Option "lambdaExternals" was removed. Please use "lambdaExternal" instead.'
    );
  }

  // Process parameters
  opts.parameters = processParameters(opts.parameters);

  // Process lambda-dockerfile
  if (typeof opts.lambdaDockerfile === 'string') {
    opts.lambdaDockerfile = readDockerfile(opts.lambdaDockerfile);
  }

  return opts;
};

// Import subcommands
import { deployBaseStackCommand } from './baseStack/command';
import { deployCicdCommand } from './cicd/command';
import { deployLambdaLayerCommand } from './lambdaLayer/command';
import { deployStaticAppCommand } from './staticApp/command';
import { deployVercelCommand } from './vercel/command';

/**
 * Create the deploy command with all subcommands
 */
export const deployCommand = new Command('deploy')
  .description('Deploy cloud resources.')
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .option('--aws-account-id <id>', options['aws-account-id'].describe)
  .option('--destroy', options.destroy.describe, options.destroy.default)
  .option(
    '--lambda-dockerfile <path>',
    options['lambda-dockerfile'].describe,
    options['lambda-dockerfile'].default
  )
  .option(
    '--lambda-image',
    options['lambda-image'].describe,
    options['lambda-image'].default
  )
  .option(
    '--lambda-external <modules...>',
    options['lambda-external'].describe
  )
  .option(
    '--lambda-entry-points-base-dir <dir>',
    options['lambda-entry-points-base-dir'].describe,
    options['lambda-entry-points-base-dir'].default
  )
  .option(
    '--lambda-entry-points <files...>',
    options['lambda-entry-points'].describe
  )
  .option(
    '--lambda-format <format>',
    options['lambda-format'].describe,
    options['lambda-format'].default
  )
  .option(
    '--lambda-outdir <dir>',
    options['lambda-outdir'].describe,
    options['lambda-outdir'].default
  )
  .option(
    '--lambda-runtime <runtime>',
    options['lambda-runtime'].describe,
    options['lambda-runtime'].default
  )
  .option('-p, --parameters <params...>', options.parameters.describe)
  .option(
    '--skip-deploy',
    options['skip-deploy'].describe,
    options['skip-deploy'].default
  )
  .option('--stack-name <name>', options['stack-name'].describe)
  .option('-t, --template-path <path>', options['template-path'].describe)
  .hook('preAction', async (thisCommand) => {
    const opts = thisCommand.opts();
    await handleDeployPreAction(opts);
  })
  .action(async function (this: Command) {
    const opts = this.opts();
    const { destroy, ...rest } = opts;

    if (destroy) {
      destroyCloudFormation();
    } else {
      deployCloudFormation(rest as any);
    }
  });

// Add describe subcommand
deployCommand
  .command('describe')
  .description('Print the outputs of the deployment.')
  .action(async function (this: Command) {
    try {
      const parentOpts = this.parent?.opts() || {};
      const newStackName = parentOpts.stackName || (await getStackName());
      await printStackOutputsAfterDeploy({ stackName: newStackName });
    } catch (error: any) {
      log.info(logPrefix, 'Cannot describe stack. Message: %s', error.message);
    }
  });

// Add subcommands
deployCommand.addCommand(deployBaseStackCommand);
deployCommand.addCommand(deployCicdCommand);
deployCommand.addCommand(deployLambdaLayerCommand);
deployCommand.addCommand(deployStaticAppCommand);
deployCommand.addCommand(deployVercelCommand);
