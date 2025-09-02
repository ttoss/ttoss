# @ttoss/cloud-auth

AWS Cognito authentication infrastructure as code. Creates user pools, identity pools, and Lambda triggers with CloudFormation.

## Installation

```bash
pnpm add @ttoss/cloud-auth
```

## Quick Start

```typescript
// src/cloudformation.ts
import { createAuthTemplate } from '@ttoss/cloud-auth';

export default createAuthTemplate();
```

## Core Features

### User Pool Configuration

The template creates a secure user pool with email-based authentication by default:

```typescript
const template = createAuthTemplate({
  autoVerifiedAttributes: ['email'], // Default
  usernameAttributes: ['email'], // Default
  deletionProtection: 'ACTIVE', // Optional: ACTIVE | INACTIVE
  schema: [
    {
      attributeDataType: 'String',
      name: 'department',
      required: false,
      mutable: true,
      stringAttributeConstraints: {
        maxLength: '100',
        minLength: '1',
      },
    },
  ],
});
```

### Lambda Triggers

Customize authentication workflows with [AWS Cognito Lambda triggers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-working-with-lambda-triggers.html). Lambda triggers accept either string ARNs or `Fn::GetAtt` CloudFormation references.

#### Basic Lambda Trigger Setup

```typescript
const template = createAuthTemplate({
  lambdaTriggers: {
    preSignUp: 'arn:aws:lambda:us-east-1:123456789:function:PreSignUp',
    postConfirmation: { 'Fn::GetAtt': ['PostConfirmationFunction', 'Arn'] },
    preTokenGeneration: { 'Fn::GetAtt': ['TokenCustomizerFunction', 'Arn'] },
  },
});
```

#### Complete Lambda Integration Example

Based on the [Terezinha Farm implementation](https://github.com/ttoss/ttoss/tree/main/terezinha-farm/auth), here's how to integrate Lambda functions with your auth template:

```typescript
// src/cloudformation.ts
import { createAuthTemplate } from '@ttoss/cloud-auth';

export default () => {
  const template = createAuthTemplate({
    lambdaTriggers: {
      postConfirmation: {
        'Fn::GetAtt': ['PostConfirmationLambdaFunction', 'Arn'],
      },
    },
  });

  // Add Lambda S3 parameters for Carlin deployment
  template.Parameters = {
    ...template.Parameters,
    LambdaS3Bucket: { Type: 'String' },
    LambdaS3Key: { Type: 'String' },
    LambdaS3ObjectVersion: { Type: 'String' },
  };

  // Define Lambda function resource
  template.Resources = {
    ...template.Resources,
    PostConfirmationLambdaFunction: {
      Type: 'AWS::Lambda::Function',
      Properties: {
        Handler: 'triggers.postConfirmation',
        Code: {
          S3Bucket: { Ref: 'LambdaS3Bucket' },
          S3Key: { Ref: 'LambdaS3Key' },
          S3ObjectVersion: { Ref: 'LambdaS3ObjectVersion' },
        },
        Role: 'arn:aws:iam::account:role/lambda-execution-role',
        Runtime: 'nodejs22.x',
      },
    },
  };

  return template;
};
```

#### Lambda Function Implementation

Create your trigger functions following AWS Lambda handler patterns:

```typescript
// src/triggers.ts
import type { PostConfirmationTriggerHandler } from 'aws-lambda';

export const postConfirmation: PostConfirmationTriggerHandler = async (
  event
) => {
  const email = event.request.userAttributes.email;

  // Custom logic: send welcome email, create user profile, etc.
  console.log(`New user confirmed: ${email}`);

  // Always return the event object
  return event;
};
```

#### Available Lambda Triggers

Check [Customizing user pool workflows with Lambda triggers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-working-with-lambda-triggers.html) for more information.

**Authentication Flow:**

- `preSignUp` - Validate signup data, auto-confirm users
- `postConfirmation` - Execute post-signup actions
- `preAuthentication` - Custom authentication validation
- `postAuthentication` - Track logins, update last seen

**Token Customization:**

- `preTokenGeneration` - Add custom claims, modify token content

**User Migration:**

- `userMigration` - Migrate users from external systems

**Custom Challenges:**

- `defineAuthChallenge` - Define custom authentication flows
- `createAuthChallenge` - Generate custom challenges
- `verifyAuthChallengeResponse` - Validate challenge responses

**Messaging:**

- `customMessage` - Customize email/SMS content
- `customEmailSender` - Third-party email providers
- `customSMSSender` - Third-party SMS providers

#### Deployment with Carlin

When using [Carlin deploy](https://ttoss.dev/docs/carlin/commands/deploy), Lambda functions are automatically built and uploaded to S3. Your `Handler` property should match your file structure:

```
src/
  └── triggers.ts          # Handler: 'triggers.postConfirmation's
```

The S3 parameters (`LambdaS3Bucket`, `LambdaS3Key`, `LambdaS3ObjectVersion`) are automatically injected by Carlin and referenced in your Lambda function's `Code` property.

### Identity Pool

Enable federated identities for AWS resource access:

```typescript
const template = createAuthTemplate({
  identityPool: {
    enabled: true,
    name: 'MyApp_IdentityPool',
    allowUnauthenticatedIdentities: false,
  },
});
```

#### Custom IAM Policies

Define specific permissions for authenticated and unauthenticated users:

```typescript
const template = createAuthTemplate({
  identityPool: {
    enabled: true,
    authenticatedPolicies: [
      {
        PolicyName: 'S3Access',
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject'],
              Resource: 'arn:aws:s3:::my-bucket/${aws:PrincipalTag/userId}/*',
            },
          ],
        },
      },
    ],
  },
});
```

#### Principal Tags for Access Control

Enable [attribute-based access control](https://docs.aws.amazon.com/cognito/latest/developerguide/attributes-for-access-control.html) using JWT claims as IAM principal tags:

```typescript
// Default principal tags
const template = createAuthTemplate({
  identityPool: { enabled: true },
  // Maps: appClientId → 'aud', userId → 'sub'
});

// Custom principal tags
const template = createAuthTemplate({
  identityPool: {
    enabled: true,
    principalTags: {
      department: 'custom:department',
      role: 'custom:role',
      userId: 'sub',
    },
  },
});
```

Use principal tags in IAM policies for fine-grained access control:

```json
{
  "Effect": "Allow",
  "Action": "dynamodb:Query",
  "Resource": "arn:aws:dynamodb:*:*:table/UserData",
  "Condition": {
    "StringEquals": {
      "dynamodb:LeadingKeys": "${aws:PrincipalTag/userId}"
    }
  }
}
```

#### External IAM Roles

Use existing IAM roles instead of creating new ones:

```typescript
const template = createAuthTemplate({
  identityPool: {
    enabled: true,
    authenticatedRoleArn: 'arn:aws:iam::123456789012:role/AuthenticatedRole',
    unauthenticatedRoleArn:
      'arn:aws:iam::123456789012:role:UnauthenticatedRole',
  },
});
```

## Template Outputs

The template provides these CloudFormation outputs for integration:

- **Region**: AWS region for Amplify Auth configuration
- **UserPoolId**: Cognito User Pool ID
- **AppClientId**: User Pool Client ID for applications
- **IdentityPoolId**: Identity Pool ID (when enabled)

Access outputs in other CloudFormation templates:

```yaml
AuthConfig:
  UserPoolId: !ImportValue MyAuthStack:UserPoolId
  AppClientId: !ImportValue MyAuthStack:AppClientId
```

## Advanced Configuration

### Custom User Attributes

Define application-specific user attributes with validation:

```typescript
const template = createAuthTemplate({
  schema: [
    {
      attributeDataType: 'Number',
      name: 'employee_id',
      required: true,
      mutable: false,
      numberAttributeConstraints: {
        minValue: '1000',
        maxValue: '99999',
      },
    },
    {
      attributeDataType: 'String',
      name: 'department',
      required: false,
      mutable: true,
      stringAttributeConstraints: {
        minLength: '2',
        maxLength: '50',
      },
    },
  ],
});
```

### Production Considerations

For production deployments:

- Use `Fn::GetAtt` references instead of hardcoded ARNs for Lambda functions
- Enable deletion protection (`deletionProtection: 'ACTIVE'`) for production user pools
- Configure appropriate IAM roles with minimal required permissions for Lambda functions
- Implement proper error handling in Lambda triggers to prevent authentication failures
- Set up monitoring and alerting for authentication metrics
- Consider regional failover strategies

## Related Resources

- [AWS Cognito User Pools Documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Lambda Triggers Reference](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-working-with-lambda-triggers.html)
- [Attribute-Based Access Control](https://docs.aws.amazon.com/cognito/latest/developerguide/attributes-for-access-control.html)
