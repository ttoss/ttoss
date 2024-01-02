# @ttoss/cloud-auth

It's a library for creating AWS Cognito resources. It creates an user pool, identity pool, a client application, and others resources.

## Installation

```bash
pnpm add @ttoss/cloud-auth
```

## Quickstart

Create a `cloudformation.ts` file in your project and export the template:

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

#### Using attributes for access control

When you enable the identity pool, it maps the following [principal tags to handle access control](https://docs.aws.amazon.com/cognito/latest/developerguide/attributes-for-access-control.html) by default:

```yml
PrincipalTags:
  appClientId: 'aud'
  userId: 'sub'
```

This way you can use the `appClientId` and `userId` tags in your IAM policies by [controlling access for IAM principals](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_iam-tags.html#access_iam-tags_control-principals). For example:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:GetObject*",
      "Resource": "arn:aws:s3:::*-${aws:PrincipalTag/userId}/*"
    }
  ]
}
```

You can change the default tags by passing the `principalTags` property and [other tokens](https://docs.aws.amazon.com/cognito/latest/developerguide/role-based-access-control.html#token-claims-for-role-based-access-control):

```typescript
const template = createAuthTemplate({
  identityPool: {
    enabled: true,
    principalTags: {
      appId: 'aud',
      username: 'sub',
      name: 'name',
    },
  },
});
```

If you want to disable the principal tags, you can pass the `principalTags` property with `false` value:

```typescript
const template = createAuthTemplate({
  identityPool: {
    enabled: true,
    principalTags: false,
  },
});
```
