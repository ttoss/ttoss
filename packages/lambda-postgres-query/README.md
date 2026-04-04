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

Create a handler file that exports both Lambda functions:

```typescript
export { handler, readOnlyHandler } from '@ttoss/lambda-postgres-query';
```

### Environment Variables

Configure the following environment variables for the general-purpose Lambda:

```env
DATABASE_NAME=your_database_name
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_HOST=your_database_host
DATABASE_PORT=5432
SECURITY_GROUP_IDS=sg-xxxxx,sg-yyyyy
SUBNET_IDS=subnet-xxxxx,subnet-yyyyy
```

For the dedicated read-only Lambda (`readOnlyHandler`), define at least one `*_READ_ONLY` variable. Any read-only variable that is not set falls back to the corresponding main variable. For example, to point only the host to a read replica:

```env
DATABASE_HOST_READ_ONLY=your_read_only_host
# DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD are reused automatically
```

To use a fully isolated read-only database user:

```env
DATABASE_NAME_READ_ONLY=your_read_only_database_name
DATABASE_USERNAME_READ_ONLY=your_read_only_username
DATABASE_PASSWORD_READ_ONLY=your_read_only_password
DATABASE_HOST_READ_ONLY=your_read_only_host
DATABASE_PORT=5432
```

> **Security note:** If none of the `*_READ_ONLY` variables are set, the read-only Lambda throws an error at invocation time.

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

## Security: Isolating Read-Only Access

Deploying a dedicated `readOnlyHandler` Lambda lets you enforce the principle of least privilege at the AWS IAM level. Services that only need to read data (dashboards, reports, public APIs) receive IAM permissions to invoke **only** the read-only Lambda — they have no way to invoke the general-purpose Lambda and cannot perform write operations, regardless of the SQL they send.

This means a compromised or misconfigured service can never corrupt or delete data; it is limited to SELECT queries enforced both by the database (`BEGIN READ ONLY` transaction) and by the IAM boundary.

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
- `lambdaPostgresQueryFunction` (string, optional): Name of the query Lambda function. Default: `LAMBDA_POSTGRES_QUERY_FUNCTION` environment variable
- `camelCaseKeys` (boolean, optional): Convert snake_case column names to camelCase. Default: `true`

#### Returns

A [`QueryResult`](https://node-postgres.com/apis/result) object with transformed rows.

### `handler`

AWS Lambda handler function for processing database queries within the VPC. Uses `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_HOST`, and `DATABASE_PORT`.

### `readOnlyHandler`

AWS Lambda handler function for processing **read-only** database queries within the VPC. Enforces read-only access via a PostgreSQL `BEGIN READ ONLY` transaction. Uses dedicated `*_READ_ONLY` environment variables where defined, falling back to the main variables for any that are not set. Throws an error at invocation time if none of the `*_READ_ONLY` variables are defined.
