# @ttoss/lambda-postgres-query

This package create an AWS Lambda function that can query a RDS Postgres database inside a private subnet of a VPC.

The goal of this package is to provide a way to query a Postgres database from a Lambda function without exposing the database to the internet. If your project needs to query a Postgres database and access to the internet, you can follow two approaches:

1. Create a Lambda function inside a VPC and use a NAT Gateway to access the internet. This approach is expensive because you need to pay for the NAT Gateway.

2. Decompose your architecture into multiple Lambdas—some inside the VPC and some outside the VPC. The Lambda inside the VPC can query the database, and the Lambda outside the VPC can query the Lambda inside the VPC. On this approach, Lambdas outside the VPC invoke Lambdas inside the VPC using the AWS SDK to query the database. This approach is complex and requires more effort to maintain.

_Check this StackOverflow question for more information: [Why can't an AWS lambda function inside a public subnet in a VPC connect to the internet?](https://stackoverflow.com/questions/52992085/why-cant-an-aws-lambda-function-inside-a-public-subnet-in-a-vpc-connect-to-the)_

## Installation

To install this package, you need to run the following command:

```bash
pnpm install @ttoss/lambda-postgres-query
```

## Usage

### CloudFormation

Create a `src/cloudformation.ts` file with the following content:

```typescript
import { createLambdaQueryTemplate } from '@ttoss/lambda-postgres-query';
```

Create a `src/handler.ts` file with the following content:

```typescript
export { handler } from '@ttoss/lambda-postgres-query';
```

Provide the following environment variables in the `.env` file:

```env
DATABASE_NAME=
DATABASE_USERNAME=
DATABASE_PASSWORD=
DATABASE_HOST=
DATABASE_HOST_READ_ONLY=
DATABASE_PORT=
SECURITY_GROUP_IDS=
SUBNET_IDS=
```

Add the `deploy` script to the `package.json` file:

```json
{
  "scripts": {
    "deploy": "carlin deploy"
  }
}
```

[Deploy](https://ttoss.dev/docs/carlin/commands/deploy) them using the following command:

```bash
pnpm deploy
```

It'll create the necessary resources to query the Postgres database and display the name of the Lambda function created.

### Querying the database

To query the database from Lambdas outside the VPC, do the following:

```typescript
import { query } from '@ttoss/lambda-postgres-query';
import type { Handler } from 'aws-lambda';

export const handler: Handler = async (event) => {
  const text = 'SELECT * FROM table_name';
  const result = await query({ text });
  return result.rows;
};
```

## API

### `createLambdaQueryTemplate`

This function creates a CloudFormation template to deploy the Lambda function that queries the Postgres database.

### `query`

This function queries the Postgres database using the environment variables provided. It uses the [`pg`](https://node-postgres.com/) package to connect to the database.

#### Parameters

It accepts all the [`QueryConfig` object from the `pg` package](https://node-postgres.com/apis/client#queryconfig) with the following additional properties:

- `readOnly`: A boolean that indicates if the query should be executed on the read-only database, in case you provided the `DATABASE_HOST_READ_ONLY` value. Default is `true`.
- `lambdaPostgresQueryFunction`: The name of the Lambda function that queries the database. Default is the value of the `LAMBDA_POSTGRES_QUERY_FUNCTION` environment variable.
