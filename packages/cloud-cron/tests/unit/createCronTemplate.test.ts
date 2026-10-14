import {
  createCronTemplate,
  CRON_JOB_DEFAULTS,
  importValueFromParameter,
} from '../../src';

const role = importValueFromParameter('CronRoleExportedName');

test('creates a function, a log group and an exported name per job', () => {
  const template = createCronTemplate({
    role,
    jobs: {
      OnboardingCron: {
        handler: 'runOnboardingCron.handler',
        schedule: 'cron(15 10 * * ? *)',
      },
    },
  });

  expect(template.Transform).toBe('AWS::Serverless-2016-10-31');
  expect(template.Resources).toEqual({
    OnboardingCronFunction: {
      Type: 'AWS::Serverless::Function',
      Properties: {
        Handler: 'runOnboardingCron.handler',
        Runtime: CRON_JOB_DEFAULTS.runtime,
        Timeout: CRON_JOB_DEFAULTS.timeout,
        MemorySize: CRON_JOB_DEFAULTS.memorySize,
        Role: role,
        Events: {
          Schedule: {
            Type: 'Schedule',
            Properties: { Schedule: 'cron(15 10 * * ? *)' },
          },
        },
      },
    },
    OnboardingCronFunctionLogGroup: {
      Type: 'AWS::Logs::LogGroup',
      Properties: {
        LogGroupName: {
          'Fn::Join': ['', ['/aws/lambda/', { Ref: 'OnboardingCronFunction' }]],
        },
        RetentionInDays: CRON_JOB_DEFAULTS.logRetentionInDays,
      },
    },
  });
  expect(template.Outputs).toEqual({
    OnboardingCronFunctionName: {
      Value: { Ref: 'OnboardingCronFunction' },
      Export: {
        Name: { 'Fn::Sub': '${AWS::StackName}:OnboardingCronFunctionName' },
      },
    },
  });
});

test('declares several jobs in one stack, each with its own settings', () => {
  const reportRole = { Ref: 'ReportRoleArn' };

  const template = createCronTemplate({
    role,
    environment: {
      LAMBDA_POSTGRES_QUERY_FUNCTION: { Ref: 'LambdaPostgresQueryFunction' },
      POSTHOG_API_KEY: { Ref: 'PosthogApiKey' },
    },
    jobs: {
      Purge: {
        handler: 'purge.handler',
        schedule: 'rate(1 day)',
        environment: { POSTHOG_API_KEY: 'phc_override' },
      },
      Report: {
        handler: 'report.handler',
        schedule: {
          Morning: 'cron(30 11 * * ? *)',
          Night: 'cron(30 23 * * ? *)',
        },
        role: reportRole,
        timeout: 60,
        memorySize: 1024,
        logRetentionInDays: 30,
        layers: [{ Ref: 'SdkLayerArn' }],
        description: 'Twice-daily report.',
      },
    },
  });

  expect(Object.keys(template.Resources)).toEqual([
    'PurgeFunction',
    'PurgeFunctionLogGroup',
    'ReportFunction',
    'ReportFunctionLogGroup',
  ]);
  expect(Object.keys(template.Outputs ?? {})).toEqual([
    'PurgeFunctionName',
    'ReportFunctionName',
  ]);

  expect(template.Resources.PurgeFunction.Properties).toMatchObject({
    Role: role,
    Environment: {
      Variables: {
        LAMBDA_POSTGRES_QUERY_FUNCTION: { Ref: 'LambdaPostgresQueryFunction' },
        POSTHOG_API_KEY: 'phc_override',
      },
    },
  });
  expect(template.Resources.ReportFunction.Properties).toMatchObject({
    Role: reportRole,
    Timeout: 60,
    MemorySize: 1024,
    Layers: [{ Ref: 'SdkLayerArn' }],
    Description: 'Twice-daily report.',
    Events: {
      Morning: {
        Type: 'Schedule',
        Properties: { Schedule: 'cron(30 11 * * ? *)' },
      },
      Night: {
        Type: 'Schedule',
        Properties: { Schedule: 'cron(30 23 * * ? *)' },
      },
    },
  });
  expect(
    template.Resources.ReportFunctionLogGroup.Properties?.RetentionInDays
  ).toBe(30);
});

test('passes declared parameters through', () => {
  const template = createCronTemplate({
    role,
    parameters: { CronRoleExportedName: { Type: 'String' } },
    jobs: { Job: { handler: 'job.handler', schedule: 'rate(1 hour)' } },
  });

  expect(template.Parameters).toEqual({
    CronRoleExportedName: { Type: 'String' },
  });
});

test.each([
  [{ jobs: {} }, 'needs at least one job'],
  [
    { role, jobs: { 'my-job': { handler: 'a.b', schedule: 'rate(1 day)' } } },
    'must be alphanumeric',
  ],
  [
    { jobs: { Job: { handler: 'a.b', schedule: 'rate(1 day)' } } },
    'has no role',
  ],
  [
    { role, jobs: { Job: { handler: 'a.b', schedule: {} } } },
    'at least one schedule',
  ],
])('refuses an invalid template', (args, message) => {
  expect(() => {
    return createCronTemplate(args);
  }).toThrow(message);
});
