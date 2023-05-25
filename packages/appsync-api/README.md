# @ttoss/appsync-api

This package provides a opinionated way to create an AppSync API using [`@ttoss/graphql-api` API](https://ttoss.dev/docs/modules/packages/graphql-api/).

## Installation

```bash
yarn add @ttoss/appsync-api @ttoss/graphql-api graphql
```

## Quickstart

You can create and deploy an AppSync API in four steps:

1. Create a `schemaComposer` object using [`graphql-compose`](https://graphql-compose.github.io/docs/intro/quick-start.html), that the next steps will use to create the API.

2. Create a `cloudformation.ts` file that exports a CloudFormation template using `createApiTemplate`:

```typescript
import { createApiTemplate } from '@ttoss/appsync-api';
import { schemaComposer } from '@ttoss/graphql-api';

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
import { schemaComposer } from '@ttoss/graphql-api';

export const handler = createAppSyncResolverHandler({ schemaComposer });
```

4. Add `graphql` to the `lambdaExternals` array on `carlin.yml`:

```yml
lambdaExternals:
  - graphql
```

Now you can deploy your API using `carlin deploy`:

```bash
carlin deploy
```
