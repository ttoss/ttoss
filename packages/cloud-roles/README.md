# @ttoss/cloud-roles

Create CloudFormation templates for IAM roles with TypeScript.

## Installation

```bash
pnpm add @ttoss/cloud-roles
```

## Usage

```typescript
import { createRolesTemplate } from '@ttoss/cloud-roles';

const template = createRolesTemplate({
  resources: {
    AppSyncLambdaFunctionIAMRole: {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: 'sts:AssumeRole',
              Principal: { Service: 'lambda.amazonaws.com' },
            },
          ],
        },
        ManagedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
      },
    },
  },
});

export default template;
```

## API

### `createRolesTemplate`

Generates a CloudFormation template containing one or more `AWS::IAM::Role` resources and automatically exports each role's ARN as a stack output.

#### Parameters

- `resources: { [key: string]: IAMRoleResource }` — map of logical resource IDs to `AWS::IAM::Role` resource definitions.
- `path?: string` — IAM path applied to every role that does not already define `Properties.Path`. Defaults to `IAM_PATH` (`'/custom-iam/'`). IAM (and thus CloudFormation) requires paths to begin and end with `/` (e.g. `'/my-app/'`); `createRolesTemplate` does not validate this, so an invalid path will cause a deploy-time error.

#### Behavior

- Any role in `resources` that has no `Properties.Path` set will have its `Path` automatically set to the resolved `path` value.
- For every role, a stack output named `<LogicalId>Arn` is added, exporting the role ARN under the key `<StackName>:<LogicalId>Arn`.
- `createRolesTemplate` mutates the provided `resources` objects by setting `resource.Properties.Path` when it is missing. If you need to reuse the same resource definitions elsewhere, clone them before passing them to this function.

#### Overriding the default path

```typescript
import { createRolesTemplate } from '@ttoss/cloud-roles';

const template = createRolesTemplate({
  path: '/my-app/',
  resources: {
    /* ... */
  },
});
```

Roles that already declare `Properties.Path` are left unchanged.

### `IAM_PATH`

The default IAM path constant used when `path` is not provided:

```typescript
import { IAM_PATH } from '@ttoss/cloud-roles';

console.log(IAM_PATH); // '/custom-iam/'
```

## Security: restricting `iam:PassRole` with IAM paths

Setting a dedicated IAM path for application roles enables a simple but effective deployment security boundary.

**Pattern:**

1. Create all application roles centrally with `createRolesTemplate` (keeping them under `/custom-iam/` or a custom path).
2. Grant deployment users `iam:PassRole` only for roles under that path.
3. Deny deployment users the ability to create, update, tag, or delete IAM roles.

This separates _privileged IAM management_ (run infrequently, with elevated permissions) from _regular application deployment_ (run on every release, with limited permissions).

**Example deployment policy:**

```yaml
- Effect: Allow
  Action:
    - iam:PassRole
  Resource:
    - arn:aws:iam::*:role/custom-iam/*
  Condition:
    StringEquals:
      iam:PassedToService:
        - lambda.amazonaws.com
        - appsync.amazonaws.com
```

With this policy, a deployment pipeline can attach centrally managed roles to Lambda functions and AppSync data sources, but cannot create or modify those roles itself.
