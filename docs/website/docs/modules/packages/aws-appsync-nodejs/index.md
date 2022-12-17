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

## Getting Started

Example of how to use the package.

### With API Key

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
  // eslint-disable-next-line no-console
  console.log(result);
});
```
