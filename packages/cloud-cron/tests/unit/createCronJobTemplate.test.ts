import {
  createCronJobTemplate,
  HANDLER_DEFAULT,
  LOG_RETENTION_DAYS_DEFAULT,
  MEMORY_SIZE_DEFAULT,
  RUNTIME_DEFAULT,
  TIMEOUT_DEFAULT,
} from '../../src/createCronJobTemplate';

describe('createCronJobTemplate', () => {
  test('should create a minimal cron job template with defaults', () => {
    const template = createCronJobTemplate({
      schedule: 'cron(0 21 * * ? *)',
    });

    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(template.Transform).toBe('AWS::Serverless-2016-10-31');
    expect(template.Description).toBe('A scheduled Lambda cron job.');

    expect(template.Parameters).toEqual({
      LambdaS3Bucket: {
        Type: 'String',
        Description: 'The S3 bucket where the Lambda code is stored.',
      },
      LambdaS3Key: {
        Type: 'String',
        Description: 'The S3 key where the Lambda code is stored.',
      },
      LambdaS3ObjectVersion: {
        Type: 'String',
        Description: 'The S3 object version of the Lambda code.',
      },
    });

    expect(template.Resources.CronJobExecutionRole).toEqual({
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        ManagedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
      },
    });

    expect(template.Resources.CronJobFunction).toEqual({
      Type: 'AWS::Serverless::Function',
      Properties: {
        CodeUri: {
          Bucket: { Ref: 'LambdaS3Bucket' },
          Key: { Ref: 'LambdaS3Key' },
          Version: { Ref: 'LambdaS3ObjectVersion' },
        },
        Handler: HANDLER_DEFAULT,
        Runtime: RUNTIME_DEFAULT,
        Timeout: TIMEOUT_DEFAULT,
        MemorySize: MEMORY_SIZE_DEFAULT,
        Role: { 'Fn::GetAtt': ['CronJobExecutionRole', 'Arn'] },
        Events: {
          ScheduleEvent: {
            Type: 'Schedule',
            Properties: {
              Schedule: 'cron(0 21 * * ? *)',
            },
          },
        },
      },
    });

    expect(template.Resources.CronJobFunctionLogs).toEqual({
      Type: 'AWS::Logs::LogGroup',
      DependsOn: 'CronJobFunction',
      Properties: {
        LogGroupName: {
          'Fn::Join': ['', ['/aws/lambda/', { Ref: 'CronJobFunction' }]],
        },
        RetentionInDays: LOG_RETENTION_DAYS_DEFAULT,
      },
    });

    expect(template.Outputs).toEqual({
      CronJobFunctionName: {
        Description: 'Cron job Lambda function name.',
        Value: { Ref: 'CronJobFunction' },
      },
      CronJobFunctionArn: {
        Description: 'Cron job Lambda function ARN.',
        Value: { 'Fn::GetAtt': ['CronJobFunction', 'Arn'] },
      },
    });
  });

  test('should use custom handler, runtime, timeout, memorySize, and logRetentionDays', () => {
    const template = createCronJobTemplate({
      handler: 'runNotificationsCron.handler',
      schedule: 'rate(1 day)',
      runtime: 'nodejs20.x',
      timeout: 300,
      memorySize: 1024,
      logRetentionDays: 30,
    });

    const functionProps = template.Resources.CronJobFunction.Properties;
    expect(functionProps?.Handler).toBe('runNotificationsCron.handler');
    expect(functionProps?.Runtime).toBe('nodejs20.x');
    expect(functionProps?.Timeout).toBe(300);
    expect(functionProps?.MemorySize).toBe(1024);

    expect(
      template.Resources.CronJobFunctionLogs.Properties?.RetentionInDays
    ).toBe(30);
  });

  test('should include environment variables when provided', () => {
    const template = createCronJobTemplate({
      schedule: 'cron(0 21 * * ? *)',
      environment: {
        LAMBDA_POSTGRES_QUERY_FUNCTION: { Ref: 'LambdaPostgresQueryFunction' },
        POSTHOG_API_KEY: { Ref: 'PostHogApiKey' },
      },
    });

    const functionProps = template.Resources.CronJobFunction.Properties;
    expect(functionProps?.Environment).toEqual({
      Variables: {
        LAMBDA_POSTGRES_QUERY_FUNCTION: { Ref: 'LambdaPostgresQueryFunction' },
        POSTHOG_API_KEY: { Ref: 'PostHogApiKey' },
      },
    });
  });

  test('should not include Environment when environment is empty', () => {
    const template = createCronJobTemplate({
      schedule: 'cron(0 21 * * ? *)',
      environment: {},
    });

    const functionProps = template.Resources.CronJobFunction.Properties;
    expect(functionProps?.Environment).toBeUndefined();
  });

  test('should add lambda invoke permissions IAM policy', () => {
    const template = createCronJobTemplate({
      schedule: 'cron(0 21 * * ? *)',
      lambdaInvokePermissions: [
        { Ref: 'LambdaPostgresQueryFunction' },
        { Ref: 'LambdaCreateNotifyName' },
        { Ref: 'LambdaContextsFunction' },
      ],
    });

    const roleProperties = template.Resources.CronJobExecutionRole.Properties;
    expect(roleProperties?.Policies).toEqual([
      {
        PolicyName: 'LambdaInvokePolicy',
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: 'lambda:InvokeFunction',
              Resource: [
                { Ref: 'LambdaPostgresQueryFunction' },
                { Ref: 'LambdaCreateNotifyName' },
                { Ref: 'LambdaContextsFunction' },
              ],
            },
          ],
        },
      },
    ]);
  });

  test('should add DynamoDB permissions IAM policy', () => {
    const template = createCronJobTemplate({
      schedule: 'cron(30 11,23 * * ? *)',
      dynamoDbPermissions: [{ Ref: 'OcaTokensTableArn' }],
    });

    const roleProperties = template.Resources.CronJobExecutionRole.Properties;
    expect(roleProperties?.Policies).toEqual([
      {
        PolicyName: 'DynamoDbPolicy',
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              Resource: [{ Ref: 'OcaTokensTableArn' }],
            },
          ],
        },
      },
    ]);
  });

  test('should add both lambda invoke and DynamoDB permissions', () => {
    const template = createCronJobTemplate({
      schedule: 'cron(30 11,23 * * ? *)',
      lambdaInvokePermissions: [{ Ref: 'SomeLambdaArn' }],
      dynamoDbPermissions: [{ Ref: 'SomeTableArn' }],
    });

    const roleProperties = template.Resources.CronJobExecutionRole.Properties;
    expect(roleProperties?.Policies).toHaveLength(2);
    expect(roleProperties?.Policies[0].PolicyName).toBe('LambdaInvokePolicy');
    expect(roleProperties?.Policies[1].PolicyName).toBe('DynamoDbPolicy');
  });

  test('should not include Policies when no permissions are provided', () => {
    const template = createCronJobTemplate({
      schedule: 'cron(0 21 * * ? *)',
    });

    const roleProperties = template.Resources.CronJobExecutionRole.Properties;
    expect(roleProperties?.Policies).toBeUndefined();
  });

  test('should include Lambda layers when provided', () => {
    const template = createCronJobTemplate({
      schedule: 'cron(30 11,23 * * ? *)',
      layers: [
        {
          'Fn::Sub':
            'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:layer:FacebookNodejsBusinessSdk:1',
        },
      ],
    });

    const functionProps = template.Resources.CronJobFunction.Properties;
    expect(functionProps?.Layers).toEqual([
      {
        'Fn::Sub':
          'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:layer:FacebookNodejsBusinessSdk:1',
      },
    ]);
  });

  test('should not include Layers when layers is not provided', () => {
    const template = createCronJobTemplate({
      schedule: 'cron(0 21 * * ? *)',
    });

    const functionProps = template.Resources.CronJobFunction.Properties;
    expect(functionProps?.Layers).toBeUndefined();
  });

  test('should create a full notifications-cron-like template', () => {
    const template = createCronJobTemplate({
      handler: 'runNotificationsCron.handler',
      schedule: 'cron(0 21 * * ? *)',
      environment: {
        LAMBDA_POSTGRES_QUERY_FUNCTION: { Ref: 'LambdaPostgresQueryFunction' },
        LAMBDA_CREATE_NOTIFY_NAME: { Ref: 'LambdaCreateNotifyName' },
        LAMBDA_CONTEXTS_FUNCTION: { Ref: 'LambdaContextsFunction' },
        POSTHOG_API_KEY: { Ref: 'PostHogApiKey' },
      },
      lambdaInvokePermissions: [
        { Ref: 'LambdaPostgresQueryFunction' },
        { Ref: 'LambdaCreateNotifyName' },
        { Ref: 'LambdaContextsFunction' },
      ],
    });

    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(template.Transform).toBe('AWS::Serverless-2016-10-31');
    expect(Object.keys(template.Resources)).toEqual([
      'CronJobExecutionRole',
      'CronJobFunction',
      'CronJobFunctionLogs',
    ]);

    const functionProps = template.Resources.CronJobFunction.Properties;
    expect(functionProps?.Handler).toBe('runNotificationsCron.handler');
    expect(functionProps?.Events?.ScheduleEvent?.Properties?.Schedule).toBe(
      'cron(0 21 * * ? *)'
    );
    expect(functionProps?.Environment?.Variables).toHaveProperty(
      'LAMBDA_POSTGRES_QUERY_FUNCTION'
    );

    const roleProps = template.Resources.CronJobExecutionRole.Properties;
    expect(roleProps?.Policies).toHaveLength(1);
    expect(roleProps?.Policies[0].PolicyName).toBe('LambdaInvokePolicy');
  });

  test('should create a full subscription-cron-like template', () => {
    const template = createCronJobTemplate({
      handler: 'runSubscriptionCron.handler',
      schedule: 'cron(30 11,23 * * ? *)',
      environment: {
        META_CLIENT_ID: { Ref: 'MetaClientId' },
        META_CLIENT_SECRET: { Ref: 'MetaClientSecret' },
        OCA_TOKENS_TABLE_NAME: { Ref: 'OcaTokensTableName' },
        POSTHOG_API_KEY: { Ref: 'PostHogApiKey' },
        POSTHOG_HOST: { Ref: 'PostHogHost' },
      },
      lambdaInvokePermissions: [{ Ref: 'SomeLambdaArn' }],
      dynamoDbPermissions: [{ Ref: 'OcaTokensTableArn' }],
      layers: [
        {
          'Fn::Sub':
            'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:layer:FacebookNodejsBusinessSdk:1',
        },
      ],
    });

    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(template.Transform).toBe('AWS::Serverless-2016-10-31');

    const functionProps = template.Resources.CronJobFunction.Properties;
    expect(functionProps?.Handler).toBe('runSubscriptionCron.handler');
    expect(functionProps?.Layers).toHaveLength(1);
    expect(functionProps?.Environment?.Variables).toHaveProperty(
      'META_CLIENT_ID'
    );

    const roleProps = template.Resources.CronJobExecutionRole.Properties;
    expect(roleProps?.Policies).toHaveLength(2);
  });
});
