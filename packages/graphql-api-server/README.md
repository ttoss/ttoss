# @ttoss/graphql-api-server

This package provides a Koa server to run your [`@ttoss/graphql-api` API](https://ttoss.dev/docs/modules/packages/graphql-api/).

## Installation

```bash
pnpm add @ttoss/graphql-api-server @ttoss/graphql-api graphql
```

## Getting Started

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

## Middlewares

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

## Handling Other Routes

If you want to handle other routes than `/graphql`, you can use the `Router` class from `koa` and add it to the server.

### Serving a SPA

```ts
import { createServer } from '@ttoss/graphql-api-server';
import { schemaComposer } from './schemaComposer';
import mount from 'koa-mount';
import * as path from 'path';

const server = createServer({
  schemaComposer,
  graphiql: true,
});

const APP_DIR = path.resolve(__dirname, '../../app/dist');

server.use(mount('/', serve(APP_DIR)));

/**
 * Serve a SPA—redirect all requests to index.html
 * https://dejanvasic.wordpress.com/2020/08/22/serving-react-spa-in-koa/
 */
server.use(async (ctx, next) => {
  return await serve(APP_DIR)(Object.assign(ctx, { path: 'index.html' }), next);
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
```

### Serving Another Endpoint

```ts
import { Router, createServer } from '@ttoss/graphql-api-server';
import { schemaComposer } from './schemaComposer';

const server = createServer({
  schemaComposer,
  graphiql: true,
});

const router = new Router();

router.get('/health', (ctx: any) => {
  ctx.body = 'OK';
});

server.use(router.routes()).use(router.allowedMethods());

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
```

## CORS

You can enable CORS by setting the `cors` option. You can check the available options on [@koa/cors package](https://github.com/koajs/cors?tab=readme-ov-file#corsoptions).

```ts
import { createServer } from '@ttoss/graphql-api-server';

const server = createServer({
  schemaComposer,
  cors: {
    origin: '*',
    allowMethods: ['GET', 'POST'],
  },
});
```
