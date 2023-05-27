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

- No authentication
- [`AWS_COGNITO_USER_POOLS`](#aws_cognito_user_pools)

### No authentication

You can disable authentication by not setting the `authenticationType` option.

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

### Middlewares

You can add middlewares compatible with [`graphql-middleware`](https://github.com/dimatill/graphql-middleware) to the server using the `middlewares` option.

```ts
import { createServer } from '@ttoss/graphql-api-server';
import { schemaComposer } from './schemaComposer';
import { allow, deny, shield } from 'graphql-shield';

const NotAuthorizedError = new Error('Not authorized!');
/**
 * The error name is the same value `errorType` on GraphQL errors response.
 */
NotAuthorizedError.name = 'NotAuthorizedError';

const permissions = shield(
  {
    Query: {
      '*': deny,
      author: allow,
    },
    Author: {
      id: allow,
      name: allow,
    },
  },
  {
    fallbackRule: deny,
    fallbackError: NotAuthorizedError,
  }
);

const server = createServer({
  schemaComposer,
  middlewares: [permissions],
});
```
