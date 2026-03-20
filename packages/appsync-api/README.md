# @ttoss/appsync-api

This package provides a opinionated way to create an AppSync API using [`@ttoss/graphql-api` API](/docs/modules/packages/graphql-api/).

## Installation

```bash
pnpm add @ttoss/appsync-api @ttoss/graphql-api graphql
```

## Getting Started

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

4. Add `graphql` to the `lambdaExternals` array on `carlin.yml`:

```yml
lambdaExternals:
  - graphql
```

Now you can deploy your API using `carlin deploy`:

```bash
carlin deploy
```

## API

### Resolvers Context

The `createAppSyncResolverHandler` function adds the `context` object to the resolvers. This object contains the following properties:

- `handler` - [AWS Lambda context object](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html).
- `request` - AppSync request object (see [Request section](https://docs.aws.amazon.com/appsync/latest/devguide/resolver-context-reference-js.html)).
- `identity` - AppSync identity object (see [Identity section](https://docs.aws.amazon.com/appsync/latest/devguide/resolver-context-reference-js.html)).

### createContext

Use `createContext` to enrich the resolver context once per request. Its return value is shallow-merged into the base context, making it available to every resolver. This is the recommended way to resolve per-request values like a `userId` from Cognito:

```ts
import { createAppSyncResolverHandler } from '@ttoss/appsync-api';
import { schemaComposer } from './schemaComposer';
import { getUserIdFromCognitoSub } from './auth';

export const handler = createAppSyncResolverHandler({
  schemaComposer,
  createContext: async ({ identity }) => ({
    userId: await getUserIdFromCognitoSub(identity?.sub),
  }),
});
```

Every resolver then receives `context.userId` without having to derive it individually.

### Middlewares

You can use [`graphql-middleware`](https://github.com/dimatill/graphql-middleware)-compatible middlewares via the `middlewares` option. Each middleware wraps the resolver — code before `resolve()` runs **before** the resolver, code after runs **after**.

In AppSync, each Lambda invocation handles a single field, so a middleware runs exactly once per request.

Use `middlewares` for authorization rules or cross-cutting logic (logging, tracing). Combine with `createContext` for per-request context enrichment:

|                     | `createContext`                | `middlewares`                           |
| ------------------- | ------------------------------ | --------------------------------------- |
| Runs                | Once per request               | Once per resolver call                  |
| Purpose             | Enrich context (e.g. `userId`) | Auth rules, logging, before/after logic |
| Can block execution | No                             | Yes (by not calling `resolve`)          |

#### Authorization with GraphQL Shield

Use [GraphQL Shield](https://the-guild.dev/graphql/shield) to add authorization rules:

```ts
import { allow, deny, shield } from '@ttoss/graphql-api/shield';

const permissions = shield(
  {
    Query: { '*': deny, me: allow },
  },
  { fallbackRule: deny }
);

export const handler = createAppSyncResolverHandler({
  schemaComposer,
  middlewares: [permissions],
});
```

### Custom domain name

You can add a custom domain name to your API using the `customDomain` option.

```ts
import { createApiTemplate } from '@ttoss/appsync-api';

export const handler = createApiTemplate({
  schemaComposer,
  customDomain: {
    domainName: 'api.example.com', // required
    certificateArn: {
      'Fn::ImportValue': 'AppSyncDomainCertificateArn',
    }, // required
  },
});
```

If your domain is on Route53, you can use the option `customDomain.hostedZoneName` to create the required DNS records.

```ts
import { createApiTemplate } from '@ttoss/appsync-api';

export const template = createApiTemplate({
  schemaComposer,
  customDomain: {
    domainName: 'api.example.com', // required
    certificateArn: {
      'Fn::ImportValue': 'AppSyncDomainCertificateArn',
    }, // required
    hostedZoneName: 'example.com.', // optional
  },
});
```
