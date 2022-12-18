---
id: 'index'
title: '@ttoss/aws-appsync-nodejs'
sidebar_label: 'Readme'
sidebar_position: 0
custom_edit_url: null
---

# @ttoss/aws-appsync-nodejs

This package implements a AWS AppSync client for Node.js. We've followed the [AWS Amplify](https://docs.amplify.aws/lib/graphqlapi/graphql-from-nodejs/q/platform/js/) example to create this package.

## Installation

```bash
yarn add @ttoss/aws-appsync-nodejs
```

## Quickstart

```typescript
import { appSyncClient } from '@ttoss/aws-appsync-nodejs';

appSyncClient.setConfig({
  apiEndpoint: 'https://xxxxxx.appsync-api.us-east-1.amazonaws.com/graphql',
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

You need to configure the client with `apiEndpoint` (required), `apiKey` (optional) and `awsCredentials` (optional).

1. If you don't provide `apiKey` or `awsCredentials`, the client will try to use the AWS credentials from the environment variables of your system—local computer, AWS Lambda, EC2.

```typescript
appSyncClient.setConfig({
  apiEndpoint: 'https://xxxxxx.appsync-api.us-east-1.amazonaws.com/graphql',
});
```

2. If you provide `apiKey`, the client will use the API key to authenticate.

```typescript
appSyncClient.setConfig({
  apiEndpoint: 'https://xxxxxx.appsync-api.us-east-1.amazonaws.com/graphql',
  apiKey: 'da2-xxxxxxxxxxxxxxxxxxxxxxxxxx',
});
```

3. If you provide `awsCredentials`, the client will use the credentials to authenticate.

```typescript
appSyncClient.setConfig({
  apiEndpoint,
  awsCredentials: {
    accessKeyId: // access key id,
    secretAccessKey: // secret access key,
    sessionToken: // optional session token,
  },
});
```
