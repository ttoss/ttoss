# @ttoss/graphql-api-server

This package provides a Koa server to run your [`@ttoss/graphql-api` API](https://ttoss.dev/docs/modules/packages/graphql-api/).

## Installation

```bash
yarn add @ttoss/graphql-api-server @ttoss/graphql-api graphql
```

## Quickstart

You can use the `createServer` method to create your server.

```ts
import { createServer } from '@ttoss/graphql-api-server';
import { schemaComposer } from './schemaComposer';

const server = createServer({
  schemaComposer,
  graphiql: true,
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
```

## Authentication Types

The server supports the following authentication types:

- [`AWS_COGNITO_USER_POOLS`](#aws_cognito_user_pools)

### AWS_COGNITO_USER_POOLS

You need to set Cognito user pool [ID token](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-id-token.html) or [access token](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-access-token.html) to the `Authorization` header.

```ts
import { createServer } from '@ttoss/graphql-api-server';
import { schemaComposer } from './schemaComposer';

const server = createServer({
  schemaComposer,
  authenticationType: 'AWS_COGNITO_USER_POOLS',
  userPoolConfig: {
    userPoolId: process.env.USER_POOL_ID,
    tokenUse: 'access' // or 'id'. Default is 'access'.
    clientId: process.env.CLIENT_ID,
  },
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
```
