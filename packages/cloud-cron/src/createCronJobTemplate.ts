import type {
  CloudFormationTemplate,
  CloudFormationValue,
} from '@ttoss/cloudformation';

export const HANDLER_DEFAULT = 'handler.handler';

export const RUNTIME_DEFAULT = 'nodejs22.x';

export const TIMEOUT_DEFAULT = 900;

export const MEMORY_SIZE_DEFAULT = 512;

export const LOG_RETENTION_DAYS_DEFAULT = 14;

/**
 * Parameters for creating a CloudFormation SAM template for a scheduled
 * Lambda cron job.
 */
export interface CreateCronJobTemplateParams {
  /**
   * Lambda handler entry point.
   * @default 'handler.handler'
   */
  handler?: string;
  /**
   * EventBridge cron or rate expression.
   * @example 'cron(0 21 * * ? *)'
   * @example 'rate(1 day)'
   */
  schedule: string;
  /**
   * Node.js runtime.
   * @default 'nodejs22.x'
   */
  runtime?: string;
  /**
   * Timeout in seconds.
   * @default 900
   */
  timeout?: number;
  /**
   * Memory in MB.
   * @default 512
   */
  memorySize?: number;
  /**
   * Key/value environment variable refs for the Lambda function.
   */
  environment?: Record<string, CloudFormationValue<string>>;
  /**
   * List of Lambda ARN refs to allow invoking via IAM policy.
   */
  lambdaInvokePermissions?: CloudFormationValue<string>[];
  /**
   * Optional DynamoDB table ARN refs for IAM permissions.
   * Grants `dynamodb:GetItem`, `dynamodb:PutItem`, `dynamodb:UpdateItem`,
   * `dynamodb:DeleteItem`, `dynamodb:Query`, and `dynamodb:Scan`.
   */
  dynamoDbPermissions?: CloudFormationValue<string>[];
  /**
   * Optional Lambda layer ARN refs.
   */
  layers?: CloudFormationValue<string>[];
  /**
   * CloudWatch log retention in days.
   * @default 14
   */
  logRetentionDays?: number;
}

/**
 * Creates a CloudFormation SAM template for a scheduled Lambda cron job.
 *
 * Generates a template with:
 * - An IAM execution role with `AWSLambdaBasicExecutionRole` and optional
 *   policies for Lambda invocation and DynamoDB access
 * - An `AWS::Serverless::Function` with a Schedule event trigger
 * - An `AWS::Logs::LogGroup` with configurable retention
 *
 * Uses the carlin convention for Lambda code deployment via S3 parameters
 * (`LambdaS3Bucket`, `LambdaS3Key`, `LambdaS3ObjectVersion`).
 *
 * @example
 * ```typescript
 * import { createCronJobTemplate } from '@ttoss/cloud-cron';
 *
 * const template = createCronJobTemplate({
 *   handler: 'runNotificationsCron.handler',
 *   schedule: 'cron(0 21 * * ? *)',
 *   environment: {
 *     LAMBDA_POSTGRES_QUERY_FUNCTION: { Ref: 'LambdaPostgresQueryFunction' },
 *   },
 *   lambdaInvokePermissions: [
 *     { Ref: 'LambdaPostgresQueryFunction' },
 *   ],
 * });
 * ```
 */
export const createCronJobTemplate = ({
  handler = HANDLER_DEFAULT,
  schedule,
  runtime = RUNTIME_DEFAULT,
  timeout = TIMEOUT_DEFAULT,
  memorySize = MEMORY_SIZE_DEFAULT,
  environment,
  lambdaInvokePermissions,
  dynamoDbPermissions,
  layers,
  logRetentionDays = LOG_RETENTION_DAYS_DEFAULT,
}: CreateCronJobTemplateParams): CloudFormationTemplate => {
  const policies: Array<{
    PolicyName: string;
    PolicyDocument: {
      Version: '2012-10-17';
      Statement: Array<{
        Effect: 'Allow';
        Action: string | string[];
        Resource: CloudFormationValue<string> | CloudFormationValue<string>[];
      }>;
    };
  }> = [];

  if (lambdaInvokePermissions && lambdaInvokePermissions.length > 0) {
    policies.push({
      PolicyName: 'LambdaInvokePolicy',
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: 'lambda:InvokeFunction',
            Resource: lambdaInvokePermissions,
          },
        ],
      },
    });
  }

  if (dynamoDbPermissions && dynamoDbPermissions.length > 0) {
    policies.push({
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
            Resource: dynamoDbPermissions,
          },
        ],
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleProperties: Record<string, any> = {
    AssumeRolePolicyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    },
    ManagedPolicyArns: [
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    ],
  };

  if (policies.length > 0) {
    roleProperties.Policies = policies;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const functionProperties: Record<string, any> = {
    CodeUri: {
      Bucket: { Ref: 'LambdaS3Bucket' },
      Key: { Ref: 'LambdaS3Key' },
      Version: { Ref: 'LambdaS3ObjectVersion' },
    },
    Handler: handler,
    Runtime: runtime,
    Timeout: timeout,
    MemorySize: memorySize,
    Role: { 'Fn::GetAtt': ['CronJobExecutionRole', 'Arn'] },
    Events: {
      ScheduleEvent: {
        Type: 'Schedule',
        Properties: {
          Schedule: schedule,
        },
      },
    },
  };

  if (environment && Object.keys(environment).length > 0) {
    functionProperties.Environment = {
      Variables: environment,
    };
  }

  if (layers && layers.length > 0) {
    functionProperties.Layers = layers;
  }

  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Transform: 'AWS::Serverless-2016-10-31',
    Description: 'A scheduled Lambda cron job.',
    Parameters: {
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
    },
    Resources: {
      CronJobExecutionRole: {
        Type: 'AWS::IAM::Role',
        Properties: roleProperties,
      },
      CronJobFunction: {
        Type: 'AWS::Serverless::Function',
        Properties: functionProperties,
      },
      CronJobFunctionLogs: {
        Type: 'AWS::Logs::LogGroup',
        DependsOn: 'CronJobFunction',
        Properties: {
          LogGroupName: {
            'Fn::Join': ['', ['/aws/lambda/', { Ref: 'CronJobFunction' }]],
          },
          RetentionInDays: logRetentionDays,
        },
      },
    },
    Outputs: {
      CronJobFunctionName: {
        Description: 'Cron job Lambda function name.',
        Value: { Ref: 'CronJobFunction' },
      },
      CronJobFunctionArn: {
        Description: 'Cron job Lambda function ARN.',
        Value: { 'Fn::GetAtt': ['CronJobFunction', 'Arn'] },
      },
    },
  };
};
