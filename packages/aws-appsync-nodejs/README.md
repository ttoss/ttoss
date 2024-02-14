# @ttoss/aws-appsync-nodejs

This package implements a AWS AppSync client for Node.js. We've followed the [AWS Amplify](https://docs.amplify.aws/lib/graphqlapi/graphql-from-nodejs/q/platform/js/) example to create this package.

## Installation

```bash
pnpm add @ttoss/aws-appsync-nodejs
```

## Quickstart

```typescript
import { appSyncClient } from '@ttoss/aws-appsync-nodejs';

appSyncClient.setConfig({
  endpoint: 'https://xxxxxx.appsync-api.us-east-1.amazonaws.com/graphql',
  apiKey: 'da2-xxxxxxxxxxxxxxxxxxxxxxxxxx',
});

const query = /* GraphQL */ `
  query user($id: ID!) {
    user(id: $id) {
      id
      name
    }
  }
`;

appSyncClient.query(query, { id: '1' }).then((result) => {
  console.log(result);
});
```

## Config

You need to configure the client with `endpoint` (required), `apiKey` (optional) and `credentials` (optional).

1. If you don't provide `apiKey` or `credentials`, the client will try to use the AWS credentials from the environment variables of your system—local computer, AWS Lambda, EC2.

```typescript
appSyncClient.setConfig({
  endpoint: 'https://xxxxxx.appsync-api.us-east-1.amazonaws.com/graphql',
});
```

2. If you provide `apiKey`, the client will use the API key to authenticate.

```typescript
appSyncClient.setConfig({
  endpoint: 'https://xxxxxx.appsync-api.us-east-1.amazonaws.com/graphql',
  apiKey: 'da2-xxxxxxxxxxxxxxxxxxxxxxxxxx',
});
```

3. If you provide `credentials`, the client will use the credentials to authenticate.

```typescript
appSyncClient.setConfig({
  endpoint,
  credentials: {
    accessKeyId: // access key id,
    secretAccessKey: // secret access key,
    sessionToken: // optional session token,
  },
});
```

If you provide the default endpoint (`https://xxxxxx.appsync-api.us-east-1.amazonaws.com/graphql`), the client will retrieve the region from the endpoint. If you provide the endpoint with the custom domain (`https://custom-domain.com`), you need to provide the region as well.

```typescript
appSyncClient.setConfig({
  endpoint: 'https://custom-domain.com',
  region: 'us-east-1',
  credentials: {
    accessKeyId: // access key id,
    secretAccessKey: // secret access key,
    sessionToken: // optional session token,
  },
});
```
