# @ttoss/lambda-postgres-query

Create an AWS Lambda function to securely query a PostgreSQL database in a private VPC subnet without exposing the database to the internet.

## When to Use

This package solves the challenge of querying a PostgreSQL database from AWS Lambda functions without internet access. Traditional approaches require expensive NAT Gateways or complex multi-Lambda architectures. This package provides a simpler solution by deploying a dedicated Lambda function within your VPC.

## Installation

```bash
pnpm install @ttoss/lambda-postgres-query
```

## Setup

### CloudFormation Template

Create a CloudFormation template to deploy the Lambda function:

```typescript
import { createLambdaPostgresQueryTemplate } from '@ttoss/lambda-postgres-query/cloudformation';

const template = createLambdaPostgresQueryTemplate();

export default template;
```

### Lambda Handler

Create a handler file that exports the Lambda function:

```typescript
export { handler } from '@ttoss/lambda-postgres-query';
```

### Environment Variables

Configure the following environment variables:

```env
DATABASE_NAME=your_database_name
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_HOST=your_database_host
DATABASE_HOST_READ_ONLY=your_read_only_host  # Optional
DATABASE_PORT=5432
SECURITY_GROUP_IDS=sg-xxxxx,sg-yyyyy
SUBNET_IDS=subnet-xxxxx,subnet-yyyyy
```

### Deployment

Add a deploy script to your `package.json`:

```json
{
  "scripts": {
    "deploy": "carlin deploy"
  }
}
```

Deploy using Carlin:

```bash
pnpm deploy
```

**Note:** Set `lambdaFormat: 'cjs'` in your Carlin configuration, as the `pg` package requires CommonJS.

## Usage

### Querying from External Lambdas

Query the database from Lambda functions outside the VPC:

```typescript
import { query } from '@ttoss/lambda-postgres-query';
import type { Handler } from 'aws-lambda';

export const handler: Handler = async (event) => {
  const result = await query('SELECT * FROM users');
  return result.rows;
};
```

### Advanced Query Options

```typescript
import { query } from '@ttoss/lambda-postgres-query';

// Query with parameters
const result = await query({
  text: 'SELECT * FROM users WHERE id = $1',
  values: [userId],
});

// Use read-only connection
const result = await query({
  text: 'SELECT * FROM users',
  readOnly: true, // Defaults to true
});

// Disable automatic camelCase conversion
const result = await query({
  text: 'SELECT * FROM users',
  camelCaseKeys: false, // Defaults to true
});

// Specify custom Lambda function name
const result = await query({
  text: 'SELECT * FROM users',
  lambdaPostgresQueryFunction: 'custom-function-name',
});
```

## API Reference

### `createLambdaPostgresQueryTemplate(options?)`

Creates a CloudFormation template for the PostgreSQL query Lambda function.

#### Parameters

- `handler` (string, optional): Lambda handler function name. Default: `'handler.handler'`
- `memorySize` (number, optional): Lambda memory size in MB. Default: `128`
- `timeout` (number, optional): Lambda timeout in seconds. Default: `30`

#### Returns

A CloudFormation template object.

### `query(params)`

Queries the PostgreSQL database by invoking the VPC Lambda function.

#### Parameters

Accepts either a SQL string or an options object extending [`QueryConfig`](https://node-postgres.com/apis/client#queryconfig) with additional properties:

- `text` (string): SQL query text
- `values` (array, optional): Query parameter values
- `readOnly` (boolean, optional): Use read-only database host if available. Default: `true`
- `lambdaPostgresQueryFunction` (string, optional): Name of the query Lambda function. Default: `LAMBDA_POSTGRES_QUERY_FUNCTION` environment variable
- `camelCaseKeys` (boolean, optional): Convert snake_case column names to camelCase. Default: `true`

#### Returns

A [`QueryResult`](https://node-postgres.com/apis/result) object with transformed rows.

### `handler`

AWS Lambda handler function for processing database queries within the VPC.
