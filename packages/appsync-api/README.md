# @ttoss/appsync-api

This package provides a opinionated way to create an AppSync API using [`@ttoss/graphql-api` API](/docs/modules/packages/graphql-api/).

## Installation

```bash
pnpm add @ttoss/appsync-api @ttoss/graphql-api graphql
```

## Getting Started

You can create and deploy an AppSync API in four steps:

1. Create a `schemaComposer` object using [`graphql-compose`](https://graphql-compose.github.io/docs/intro/quick-start.html), that the next steps will use to create the API.

2. Create a `cloudformation.ts` file that exports a CloudFormation template using `createApiTemplate`. Use `importValueFromParameter` from `@ttoss/cloudformation` to import cross-stack values whose export names come from template parameters:

```typescript
import { importValueFromParameter } from '@ttoss/cloudformation';
import { createApiTemplate } from '@ttoss/appsync-api';
import { schemaComposer } from './schemaComposer';

const template = createApiTemplate({
  schemaComposer,
  dataSource: {
    roleArn: importValueFromParameter('AppSyncLambdaDataSourceIAMRoleArn'),
  },
  lambdaFunction: {
    roleArn: importValueFromParameter('AppSyncLambdaFunctionIAMRoleArn'),
    environment: {
      variables: {
        TABLE_NAME: { Ref: 'DynamoTableName' },
        SHARED_SECRET: importValueFromParameter('SharedSecretExportedName'),
      },
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

|                     | `createContext`                                            | `middlewares`                                                      |
| ------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| Runs                | Once per request                                           | Once per resolver call                                             |
| Purpose             | Enrich context (e.g. `userId`)                             | Auth rules, logging, before/after logic                            |
| Can block execution | On error (request fails if `createContext` rejects/throws) | Yes (can conditionally block by not calling `resolve` or throwing) |

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

### Subscriptions

AppSync subscriptions are triggered by mutations. The recommended pattern to push events from your backend is:

1. **Define the subscription in your schema** — use the `@aws_subscribe` directive to link a subscription field to a mutation. Because this is an AppSync-specific directive, you must add it via raw SDL on the `schemaComposer`:

```typescript
import { schemaComposer } from '@ttoss/graphql-api';

// Add a NONE-source mutation and a subscription that listens to it
schemaComposer.addTypeDefs(/* GraphQL */ `
  type Message {
    content: String!
    author: String!
  }

  extend type Mutation {
    sendMessage(content: String!, author: String!): Message!
  }

  extend type Subscription {
    onMessage: Message @aws_subscribe(mutations: ["sendMessage"])
  }
`);
```

2. **Register the mutation as a NONE data-source resolver** — pass `noneDataSourceResolvers` to `createApiTemplate`. AppSync will handle these mutations with a pass-through resolver (no Lambda invocation) and automatically push the payload to subscribers.

```typescript
import { createApiTemplate } from '@ttoss/appsync-api';
import { schemaComposer } from './schemaComposer';

const template = createApiTemplate({
  schemaComposer,
  dataSource: {
    roleArn: importValueFromParameter('AppSyncLambdaDataSourceIAMRoleArn'),
  },
  lambdaFunction: {
    roleArn: importValueFromParameter('AppSyncLambdaFunctionIAMRoleArn'),
  },
  noneDataSourceResolvers: [{ typeName: 'Mutation', fieldName: 'sendMessage' }],
});

export default template;
```

3. **Trigger the subscription from your backend** — use `appSyncClient.mutate()` from `@ttoss/aws-appsync-nodejs` to call the mutation. AppSync processes it through the NONE data source and pushes the result to all active subscribers.

```typescript
import { appSyncClient } from '@ttoss/aws-appsync-nodejs';

appSyncClient.setConfig({
  endpoint: process.env.APPSYNC_ENDPOINT!,
});

await appSyncClient.mutate(
  /* GraphQL */ `
    mutation SendMessage($content: String!, $author: String!) {
      sendMessage(content: $content, author: $author) {
        content
        author
      }
    }
  `,
  { content: 'Hello!', author: 'Alice' }
);
```

> **How it works:** the `@aws_subscribe(mutations: ["sendMessage"])` directive tells AppSync to publish the mutation result to every client subscribed to `onMessage`. The mutation itself uses a NONE data source — AppSync simply forwards `$ctx.args` as the result, so there is no Lambda invocation for the trigger. This is the recommended approach described in the [AWS AppSync documentation](https://docs.aws.amazon.com/appsync/latest/eventapi/publish-http.html) and [AWS community resources](https://stackoverflow.com/questions/57610072/aws-appsync-subscriptions-without-mutations).

### Enhanced subscription filtering

By default, every client subscribed to `onMessage` receives every event. With **enhanced filtering**, clients pass arguments to the subscription field and AppSync uses those values as server-side filters — only events whose mutation result matches the subscriber's arguments are delivered.

This is achieved by adding arguments to the subscription field. AppSync automatically compares the argument values provided at subscribe time against the corresponding fields in the mutation result and skips delivery when they do not match.

**Schema changes:**

```typescript
schemaComposer.addTypeDefs(/* GraphQL */ `
  type FarmNotification {
    farmId: ID!
    message: String!
  }

  extend type Mutation {
    publishFarmNotification(farmId: ID!, message: String!): FarmNotification!
  }

  extend type Subscription {
    onFarmNotification(farmId: ID!): FarmNotification
      @aws_subscribe(mutations: ["publishFarmNotification"])
  }
`);
```

Register the mutation as a NONE data-source resolver:

```typescript
const template = createApiTemplate({
  schemaComposer,
  noneDataSourceResolvers: [
    { typeName: 'Mutation', fieldName: 'publishFarmNotification' },
  ],
  // ... other config
});
```

When `publishFarmNotification(farmId: "farm-1", message: "Hello")` is called:

- Clients subscribed with `onFarmNotification(farmId: "farm-1")` receive the event.
- Clients subscribed with `onFarmNotification(farmId: "farm-2")` do **not** receive the event.

> AppSync enhanced filtering is documented in the [AWS blog post on AppSync subscription filtering](https://aws.amazon.com/blogs/mobile/appsync-enhanced-filtering/).

### Using subscriptions with Relay

Use the [`useSubscription`](https://relay.dev/docs/api-reference/use-subscription/) hook from `react-relay`. Pass the filter arguments in `variables` — AppSync uses them to match events server-side.

```tsx
import * as React from 'react';
import { graphql, useSubscription } from 'react-relay';
import type { GraphQLSubscriptionConfig } from 'relay-runtime';

import type { FarmNotificationSubscription } from './__generated__/FarmNotificationSubscription.graphql';

const farmNotificationSubscription = graphql`
  subscription FarmNotificationSubscription($farmId: ID!) {
    onFarmNotification(farmId: $farmId) {
      farmId
      message
    }
  }
`;

export const FarmNotifications = ({ farmId }: { farmId: string }) => {
  const config = React.useMemo<
    GraphQLSubscriptionConfig<FarmNotificationSubscription>
  >(
    () => ({
      subscription: farmNotificationSubscription,
      variables: { farmId }, // AppSync filters: only events with this farmId are delivered
      onNext: (data) => {
        console.log('Received notification:', data?.onFarmNotification);
      },
      onError: (error) => {
        console.error('Subscription error:', error);
      },
    }),
    [farmId]
  );

  useSubscription(config);

  return null;
};
```

> **Relay compiler:** run `relay-compiler` after updating the schema so it generates the `__generated__/FarmNotificationSubscription.graphql.ts` file with TypeScript types. Your Relay `Network` must also be configured with a WebSocket `subscribeFunction` that connects to the AppSync real-time endpoint.

### Triggering subscriptions from a Lambda with AWS IAM

When a backend Lambda triggers a mutation to push a real-time event, AppSync needs to authorize that call. **AWS IAM** is the recommended approach: the Lambda's execution role is granted `appsync:GraphQL` permission and AppSync trusts the AWS Signature V4 request.

See the [AWS documentation on multiple authorization types](https://aws.amazon.com/blogs/mobile/using-multiple-authorization-types-with-aws-appsync-graphql-apis/) for background.

1. **Enable `AWS_IAM` as an additional authentication provider** in `createApiTemplate`:

```typescript
const template = createApiTemplate({
  schemaComposer,
  additionalAuthenticationProviders: ['AWS_IAM'],
  noneDataSourceResolvers: [
    { typeName: 'Mutation', fieldName: 'publishFarmNotification' },
  ],
  // ... other config
});
```

2. **Trigger the mutation from Lambda** using `appSyncClient` from `@ttoss/aws-appsync-nodejs`. When no `apiKey` is provided, the client automatically signs the request with the Lambda execution role's IAM credentials via AWS Signature V4:

```typescript
import { appSyncClient } from '@ttoss/aws-appsync-nodejs';

appSyncClient.setConfig({
  endpoint: process.env.APPSYNC_ENDPOINT!,
  // No apiKey — uses the Lambda execution role's IAM credentials automatically
});

await appSyncClient.mutate(
  /* GraphQL */ `
    mutation PublishFarmNotification($farmId: ID!, $message: String!) {
      publishFarmNotification(farmId: $farmId, message: $message) {
        farmId
        message
      }
    }
  `,
  { farmId: 'farm-1', message: 'Sensor alert: temperature above threshold' }
);
```

3. **Grant the Lambda execution role `appsync:GraphQL` permission** in IAM:

```json
{
  "Effect": "Allow",
  "Action": ["appsync:GraphQL"],
  "Resource": "arn:aws:appsync:<region>:<account-id>:apis/<api-id>/*"
}
```

> If you provide explicit credentials (e.g. from a cross-account role), pass them as `credentials: { accessKeyId, secretAccessKey, sessionToken }` to `setConfig`. See the [`@ttoss/aws-appsync-nodejs` documentation](/docs/modules/packages/aws-appsync-nodejs/) for details.
