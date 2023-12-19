# @ttoss/cloud-auth

It's a library for creating AWS Cognito resources. It creates an user pool, an identity pool and a client application.

## Installation

```bash
pnpm add @ttoss/cloud-auth
```

## Quickstart

Create a `clouformation.ts` file in your project and export the template:

```typescript src/cloudformation.ts
import { createAuthTemplate } from '@ttoss/cloud-auth';

const template = createAuthTemplate();

export default template;
```

## Usage

### Identity Pool

#### Create an basic identity pool

```typescript
const template = createAuthTemplate({
  identityPool: {
    enabled: true, // false by default
    name: 'MyIdentityPool',
    allowUnauthenticatedIdentities: false, // false by default
  },
});
```

#### Create an identity pool with external roles

```typescript
const template = createAuthTemplate({
  identityPool: {
    enabled: true,
    authenticatedRoleArn:
      'arn:aws:iam::123456789012:role/MyIdentityPool_AuthenticatedRole',
    unauthenticatedRoleArn:
      'arn:aws:iam::123456789012:role/MyIdentityPool_UnauthenticatedRole',
  },
});
```

#### Create an identity pool with defined policies

```typescript
const template = createAuthTemplate({
  identityPool: {
    enabled: true,
    authenticatedPolicies: [
      {
        policyName: 'MyIdentityPool_AuthenticatedPolicy',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['mobileanalytics:PutEvents', 'cognito-sync:*'],
              Resource: ['*'],
            },
          ],
        },
      },
    ],
    unauthenticatedPolicies: [
      {
        policyName: 'MyIdentityPool_UnauthenticatedPolicy',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Deny',
              Action: ['*'],
              Resource: ['*'],
            },
          ],
        },
      },
    ],
  },
});
```
