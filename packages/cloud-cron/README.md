# @ttoss/cloud-cron

Create CloudFormation (SAM) templates for scheduled Lambda cron jobs with TypeScript. One template declares any number of jobs.

## Installation

```bash
pnpm add @ttoss/cloud-cron
```

## Usage

```typescript
import {
  createCronTemplate,
  importValueFromParameter,
} from '@ttoss/cloud-cron';

export default createCronTemplate({
  role: importValueFromParameter('CronFunctionRoleExportedName'),
  environment: {
    LAMBDA_POSTGRES_QUERY_FUNCTION: { Ref: 'LambdaPostgresQueryFunction' },
  },
  jobs: {
    OnboardingCron: {
      handler: 'runOnboardingCron.handler',
      schedule: 'cron(15 10 * * ? *)',
    },
    SubscriptionCron: {
      handler: 'runSubscriptionCron.handler',
      schedule: {
        Morning: 'cron(30 11 * * ? *)',
        Night: 'cron(30 23 * * ? *)',
      },
      timeout: 600,
    },
  },
});
```

Deploy it with [carlin](https://ttoss.dev/docs/carlin/), which bundles every job's handler, adds each function's `CodeUri`, and declares the parameters it passes.

## What each job creates

A job keyed `OnboardingCron` creates:

- `OnboardingCronFunction`, an `AWS::Serverless::Function` with one `Schedule` event per expression;
- `OnboardingCronFunctionLogGroup`, its log group, with retention;
- the output `OnboardingCronFunctionName`, exported as `<StackName>:OnboardingCronFunctionName`.

These are the logical IDs a hand-written cron template usually has, so an existing stack can adopt the package without CloudFormation replacing its function or log group. Check the IDs your stack uses before switching: a renamed resource is a new resource.

## The role is an input

`createCronTemplate` never creates an IAM role. Pass the execution role's ARN, usually imported from a stack built with [`@ttoss/cloud-roles`](https://www.npmjs.com/package/@ttoss/cloud-roles), so permissions live in one place and can be reviewed apart from the jobs. Set `role` on the template for every job, or on a job to override it.

## API

### `createCronTemplate(args)`

| Argument      | Description                                                                         |
| ------------- | ----------------------------------------------------------------------------------- |
| `jobs`        | Required. Jobs keyed by an alphanumeric logical name.                               |
| `role`        | Execution role ARN for every job that does not set its own.                         |
| `environment` | Environment variables every job receives; a job's own `environment` is merged over. |
| `parameters`  | Template parameters, declared as given.                                             |
| `description` | Template description.                                                               |

Each job takes `handler` and `schedule` (an expression, or several keyed by event name), plus optional `role`, `environment`, `layers`, `description`, `runtime`, `timeout`, `memorySize` and `logRetentionInDays`. Defaults are exported as `CRON_JOB_DEFAULTS`: `nodejs24.x`, 900 seconds, 512 MB and 14 days.

It throws when there is no job, a job name is not alphanumeric, a job has no role, or a schedule map is empty.
