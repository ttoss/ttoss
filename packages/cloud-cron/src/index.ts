import type {
  CloudFormationTemplate,
  CloudFormationValue,
  Outputs,
  Parameters,
  Resources,
} from '@ttoss/cloudformation';

export { importValueFromParameter } from '@ttoss/cloudformation';

export const CRON_JOB_DEFAULTS = {
  runtime: 'nodejs24.x',
  timeout: 900,
  memorySize: 512,
  logRetentionInDays: 14,
} as const;

export type CronJob = {
  /** Lambda handler, `<file>.<export>`. carlin bundles `<file>.ts` from it. */
  handler: string;
  /**
   * An EventBridge `cron(...)` or `rate(...)` expression, or several keyed by
   * event name. A single expression is the event `Schedule`.
   */
  schedule: string | Record<string, string>;
  /** The execution role ARN. Overrides the template's `role`. */
  role?: CloudFormationValue<string>;
  description?: string;
  /** Merged over the template's `environment`. */
  environment?: Record<string, CloudFormationValue<string>>;
  layers?: CloudFormationValue<string>[];
  runtime?: string;
  /** Seconds. */
  timeout?: number;
  /** MB. */
  memorySize?: number;
  logRetentionInDays?: number;
};

export type CreateCronTemplateArgs = {
  /**
   * Keyed by logical name: job `Report` creates `ReportFunction`,
   * `ReportFunctionLogGroup` and the exported output `ReportFunctionName`.
   */
  jobs: Record<string, CronJob>;
  /**
   * The execution role ARN every job uses unless it sets its own. The role is
   * never created here, so it can live in a stack of its own.
   */
  role?: CloudFormationValue<string>;
  /** Environment variables every job receives. */
  environment?: Record<string, CloudFormationValue<string>>;
  /**
   * Declared as is. carlin already declares the parameters it passes, so this
   * is only needed for the ones it does not.
   */
  parameters?: Parameters;
  description?: string;
};

const LOGICAL_ID = /^[A-Za-z0-9]+$/;

const toScheduleEvents = (schedule: CronJob['schedule']) => {
  const schedules =
    typeof schedule === 'string' ? { Schedule: schedule } : schedule;

  if (Object.keys(schedules).length === 0) {
    throw new Error('A cron job needs at least one schedule.');
  }

  return Object.fromEntries(
    Object.entries(schedules).map(([name, expression]) => {
      return [name, { Type: 'Schedule', Properties: { Schedule: expression } }];
    })
  );
};

const toFunctionResource = ({
  job,
  role,
  environment,
}: {
  job: CronJob;
  role: CloudFormationValue<string>;
  environment: Record<string, CloudFormationValue<string>>;
}) => {
  const variables = { ...environment, ...job.environment };

  return {
    Type: 'AWS::Serverless::Function',
    Properties: {
      Handler: job.handler,
      Runtime: job.runtime ?? CRON_JOB_DEFAULTS.runtime,
      Timeout: job.timeout ?? CRON_JOB_DEFAULTS.timeout,
      MemorySize: job.memorySize ?? CRON_JOB_DEFAULTS.memorySize,
      Role: role,
      Events: toScheduleEvents(job.schedule),
      ...(job.description && { Description: job.description }),
      ...(Object.keys(variables).length > 0 && {
        Environment: { Variables: variables },
      }),
      ...(job.layers?.length && { Layers: job.layers }),
    },
  };
};

const resolveRole = ({
  name,
  job,
  role,
}: {
  name: string;
  job: CronJob;
  role?: CloudFormationValue<string>;
}) => {
  if (!LOGICAL_ID.test(name)) {
    throw new Error(
      `Cron job "${name}" must be alphanumeric: it becomes a CloudFormation logical ID.`
    );
  }

  const jobRole = job.role ?? role;

  if (!jobRole) {
    throw new Error(
      `Cron job "${name}" has no role: set it on the job or on the template.`
    );
  }

  return jobRole;
};

/**
 * Creates a SAM template with one `AWS::Serverless::Function` per cron job,
 * each with its schedule events, a log group with retention, and its name
 * exported as `<StackName>:<Job>FunctionName`.
 *
 * Deploy it with carlin, which adds every function's `CodeUri` and bundles
 * every handler.
 */
export const createCronTemplate = ({
  jobs,
  role,
  environment = {},
  parameters,
  description = 'Cron jobs. Created by @ttoss/cloud-cron.',
}: CreateCronTemplateArgs): CloudFormationTemplate => {
  const entries = Object.entries(jobs);

  if (entries.length === 0) {
    throw new Error('createCronTemplate needs at least one job.');
  }

  const resources: Resources = {};
  const outputs: Outputs = {};

  for (const [name, job] of entries) {
    const functionId = `${name}Function`;

    resources[functionId] = toFunctionResource({
      job,
      role: resolveRole({ name, job, role }),
      environment,
    });

    resources[`${functionId}LogGroup`] = {
      Type: 'AWS::Logs::LogGroup',
      Properties: {
        LogGroupName: {
          'Fn::Join': ['', ['/aws/lambda/', { Ref: functionId }]],
        },
        RetentionInDays:
          job.logRetentionInDays ?? CRON_JOB_DEFAULTS.logRetentionInDays,
      },
    };

    outputs[`${functionId}Name`] = {
      Value: { Ref: functionId },
      Export: {
        Name: { 'Fn::Sub': `\${AWS::StackName}:${functionId}Name` },
      },
    };
  }

  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Transform: 'AWS::Serverless-2016-10-31',
    Description: description,
    ...(parameters && { Parameters: parameters }),
    Resources: resources,
    Outputs: outputs,
  };
};
