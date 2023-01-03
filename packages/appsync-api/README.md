# @ttoss/appsync-api

This package provides a opinionated way to create an AppSync API.

## Installation

```bash
yarn add @ttoss/appsync-api graphql-compose graphql
```

## Quickstart

You can create and deploy an AppSync API in four steps:

1. Create a `schemaComposer` object using [`graphql-compose`](https://graphql-compose.github.io/docs/intro/quick-start.html), that the next steps will use to create the API.

2. Create a `cloudformation.ts` file that exports a CloudFormation template using `createApiTemplate`:

```typescript
import { createApiTemplate } from '@ttoss/appsync-api';
import { schemaComposer } from './schemaComposer';

const template = createApiTemplate({
  schemaComposer,
  dataSource: {
    roleArn: {
      'Fn::ImportValue': 'AppSyncLambdaDataSourceIAMRoleArn',
    },
  },
  lambdaFunction: {
    roleArn: {
      'Fn::ImportValue': 'AppSyncLambdaFunctionIAMRoleArn',
    },
  },
});

export default template;
```

3. Create a `lambda.ts` file that exports a Lambda handler function using `createAppSyncResolverHandler`:

```typescript
import { createAppSyncResolverHandler } from '@ttoss/appsync-api';
import { schemaComposer } from './schemaComposer';

export const handler = createAppSyncResolverHandler({ schemaComposer });
```

4. Add `graphql` and `graphql-compose` to the `lambdaExternals` array in `carlin.yml`:

```yml
lambdaExternals:
  - graphql
  - graphql-compose
```

Now you can deploy your API using `carlin deploy`:

```bash
carlin deploy
```

## Server

You can create a local server to test your API using `createServer`:

```typescript
import { createServer } from '@ttoss/appsync-api/server';
import { schemaComposer } from '../src/schemaComposer';

const server = createServer({ schemaComposer });

server.listen(4000, () => {
  // eslint-disable-next-line no-console
  console.log(
    'Server is running, GraphQL Playground available at http://localhost:4000/graphql'
  );
});
```
