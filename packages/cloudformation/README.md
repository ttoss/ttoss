# @ttoss/cloudformation

Utilities and TypeScript types for working with AWS CloudFormation templates.

## Installation

```bash
pnpm add @ttoss/cloudformation
```

## Intrinsic Function Types

The package exports TypeScript types for all commonly used CloudFormation intrinsic functions:

| Type                        | CloudFormation equivalent                            |
| --------------------------- | ---------------------------------------------------- |
| `CloudFormationRef`         | `{ Ref: string }`                                    |
| `CloudFormationGetAtt`      | `{ 'Fn::GetAtt': [string, string] }`                 |
| `CloudFormationJoin`        | `{ 'Fn::Join': [string, ...] }`                      |
| `CloudFormationSub`         | `{ 'Fn::Sub': string }`                              |
| `CloudFormationSelect`      | `{ 'Fn::Select': [number, string[]] }`               |
| `CloudFormationSplit`       | `{ 'Fn::Split': [string, string] }`                  |
| `CloudFormationImportValue` | `{ 'Fn::ImportValue': string \| CloudFormationSub }` |
| `CloudFormationIntrinsic`   | Union of all the above                               |
| `CloudFormationValue<T>`    | `T \| CloudFormationIntrinsic`                       |

## Helpers

### `importValueFromParameter`

Generates an `Fn::ImportValue` + `Fn::Sub` intrinsic that reads the export name
from a CloudFormation parameter. This is the standard pattern for consuming
cross-stack exports whose names are not known at author time.

```typescript
import { importValueFromParameter } from '@ttoss/cloudformation';

importValueFromParameter('AppSyncLambdaRoleArn');
// => { 'Fn::ImportValue': { 'Fn::Sub': '${AppSyncLambdaRoleArn}' } }
```

Typical use in a CloudFormation template:

```typescript
import { importValueFromParameter } from '@ttoss/cloudformation';
import { createApiTemplate } from '@ttoss/appsync-api';

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
        EXTERNAL_ARN: importValueFromParameter('SomeOtherStackExportedName'),
      },
    },
  },
});
```

When a producing stack exports a value and a consuming stack imports it with
`Fn::ImportValue`, CloudFormation protects that dependency by blocking deletion
of the producer export until imports are removed.

Producer stack output example:

```typescript
const outputs = {
  LambdaPostgresReadQueryFunctionArn: {
    Value: { 'Fn::GetAtt': ['LambdaPostgresReadQueryFunction', 'Arn'] },
    Export: {
      Name: {
        'Fn::Sub': '${AWS::StackName}-LambdaPostgresReadQueryFunctionArn',
      },
    },
  },
};
```

Consumer stack usage with parameterized export name:

```typescript
import { importValueFromParameter } from '@ttoss/cloudformation';

const resources = {
  InvokePermission: {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      FunctionName: importValueFromParameter('ReadQueryFunctionArnExportName'),
      Action: 'lambda:InvokeFunction',
      Principal: 'apigateway.amazonaws.com',
    },
  },
};
```

## Reading Templates

### `findAndReadCloudFormationTemplate`

Reads a CloudFormation template file from disk. Supports both TypeScript and
YAML files.

```typescript
import { findAndReadCloudFormationTemplate } from '@ttoss/cloudformation';

const template = await findAndReadCloudFormationTemplate({
  templatePath: './cloudformation.ts',
  options: { environment: 'Production' },
});
```
