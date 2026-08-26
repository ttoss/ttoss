# @ttoss/cloud-cron

Create CloudFormation SAM templates for scheduled Lambda cron jobs. Eliminates boilerplate when deploying Lambda functions triggered by EventBridge schedules.

## Installation

```bash
pnpm add @ttoss/cloud-cron
```

## Quick Start

```typescript
import { createCronJobTemplate } from '@ttoss/cloud-cron';

const template = createCronJobTemplate({
  handler: 'runNotificationsCron.handler',
  schedule: 'cron(0 21 * * ? *)',
});

export default template;
```

Deploy with [carlin](https://ttoss.dev/docs/carlin/):

```bash
carlin deploy
```

## API Reference

### `createCronJobTemplate(params)`

Creates a CloudFormation SAM template containing:

- **IAM Role** with `AWSLambdaBasicExecutionRole` and optional policies
- **AWS::Serverless::Function** with a Schedule event trigger
- **AWS::Logs::LogGroup** with configurable retention

Uses the carlin convention for Lambda code deployment via S3 parameters (`LambdaS3Bucket`, `LambdaS3Key`, `LambdaS3ObjectVersion`).

#### Parameters

| Parameter                 | Type                                  | Default             | Description                       |
| ------------------------- | ------------------------------------- | ------------------- | --------------------------------- |
| `handler`                 | `string`                              | `'handler.handler'` | Lambda handler entry point        |
| `schedule`                | `string`                              | **(required)**      | EventBridge cron/rate expression  |
| `runtime`                 | `string`                              | `'nodejs22.x'`      | Node.js runtime                   |
| `timeout`                 | `number`                              | `900`               | Timeout in seconds                |
| `memorySize`              | `number`                              | `512`               | Memory in MB                      |
| `environment`             | `Record<string, CloudFormationValue>` | —                   | Environment variable refs         |
| `lambdaInvokePermissions` | `CloudFormationValue[]`               | —                   | Lambda ARN refs to allow invoking |
| `dynamoDbPermissions`     | `CloudFormationValue[]`               | —                   | DynamoDB table ARN refs           |
| `layers`                  | `CloudFormationValue[]`               | —                   | Lambda layer ARN refs             |
| `logRetentionDays`        | `number`                              | `14`                | CloudWatch log retention in days  |

#### Returns

A `CloudFormationTemplate` object ready for deployment with carlin.

## Examples

### Daily notification cron

```typescript
import { createCronJobTemplate } from '@ttoss/cloud-cron';

export default createCronJobTemplate({
  handler: 'runNotificationsCron.handler',
  schedule: 'cron(0 21 * * ? *)',
  environment: {
    LAMBDA_POSTGRES_QUERY_FUNCTION: { Ref: 'LambdaPostgresQueryFunction' },
    POSTHOG_API_KEY: { Ref: 'PostHogApiKey' },
  },
  lambdaInvokePermissions: [
    { Ref: 'LambdaPostgresQueryFunction' },
    { Ref: 'LambdaCreateNotifyName' },
    { Ref: 'LambdaContextsFunction' },
  ],
});
```

### Twice-daily subscription cron with DynamoDB and layers

```typescript
import { createCronJobTemplate } from '@ttoss/cloud-cron';

export default createCronJobTemplate({
  handler: 'runSubscriptionCron.handler',
  schedule: 'cron(30 11,23 * * ? *)',
  environment: {
    META_CLIENT_ID: { Ref: 'MetaClientId' },
    OCA_TOKENS_TABLE_NAME: { Ref: 'OcaTokensTableName' },
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
```
