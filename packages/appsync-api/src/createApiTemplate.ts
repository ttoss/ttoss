import { getPackageLambdaLayerStackName } from 'carlin/src/deploy/lambdaLayer/getPackageLambdaLayerStackName';
import { readPackageJson } from 'carlin/src/utils/packageJson';
import packageJson from '../package.json';
import type { CloudFormationTemplate } from 'carlin/src/utils/cloudFormationTemplate';
import type { SchemaComposer } from 'graphql-compose';

const AppSyncGraphQLApiLogicalId = 'AppSyncGraphQLApi';

export const AppSyncGraphQLSchemaLogicalId = 'AppSyncGraphQLSchema';

const AppSyncLambdaFunctionIAMRoleLogicalId = 'AppSyncLambdaFunctionIAMRole';

export const AppSyncLambdaFunctionLogicalId = 'AppSyncLambdaFunction';

const AppSyncLambdaFunctionAppSyncDataSourceIAMRoleLogicalId =
  'AppSyncLambdaFunctionAppSyncDataSourceIAMRole';

const AppSyncLambdaFunctionAppSyncDataSourceLogicalId =
  'AppSyncLambdaFunctionAppSyncDataSource';

export const createApiTemplate = ({
  schemaComposer,
}: {
  schemaComposer: SchemaComposer<any>;
}): CloudFormationTemplate => {
  /**
   * It should be on top of the file, otherwise it will have empty Mutation
   * or Subscription if there are no resolvers for them.
   */
  const sdl = schemaComposer.toSDL();

  /**
   * Get FieldName and TypeName. `resolveMethods` is a Map of
   * `typeName: { fieldName: resolverFn }`
   */
  const resolveMethods = schemaComposer.getResolveMethods();

  const resolveMethodsEntries = Object.entries(resolveMethods).flatMap(
    ([typeName, fieldResolvers]) => {
      return Object.entries(fieldResolvers).map(([fieldName]) => {
        return {
          fieldName,
          typeName,
        };
      });
    }
  );

  const { name } = packageJson;

  const { dependencies } = readPackageJson();

  const dependencyVersion = dependencies[name];

  if (!dependencyVersion) {
    throw new Error(
      `The package ${name} is not installed in the project. Please install it with "yarn add ${name}".`
    );
  }

  const lambdaLayerStackName = getPackageLambdaLayerStackName(
    [name, dependencyVersion].join('@')
  );

  const template: CloudFormationTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Parameters: {
      Environment: {
        Default: 'Staging',
        Type: 'String',
        AllowedValues: ['Staging', 'Production'],
      },
      LambdaS3Bucket: {
        Type: 'String',
      },
      LambdaS3Key: {
        Type: 'String',
      },
      LambdaS3ObjectVersion: {
        Type: 'String',
      },
    },
    Resources: {
      [AppSyncGraphQLApiLogicalId]: {
        Type: 'AWS::AppSync::GraphQLApi',
        Properties: {
          AuthenticationType: 'API_KEY',
          Name: {
            'Fn::Join': [
              ':',
              [{ Ref: 'AWS::StackName' }, AppSyncGraphQLApiLogicalId],
            ],
          },
        },
      },
      [AppSyncGraphQLSchemaLogicalId]: {
        Type: 'AWS::AppSync::GraphQLSchema',
        Properties: {
          ApiId: { 'Fn::GetAtt': [AppSyncGraphQLApiLogicalId, 'ApiId'] },
          Definition: sdl,
        },
      },
      [AppSyncLambdaFunctionIAMRoleLogicalId]: {
        Type: 'AWS::IAM::Role',
        Properties: {
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: 'sts:AssumeRole',
                Principal: {
                  Service: 'lambda.amazonaws.com',
                },
              },
            ],
          },
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ],
          Path: '/custom-iam/',
        },
      },
      [AppSyncLambdaFunctionLogicalId]: {
        Type: 'AWS::Lambda::Function',
        Properties: {
          Code: {
            S3Bucket: { Ref: 'LambdaS3Bucket' },
            S3Key: { Ref: 'LambdaS3Key' },
            S3ObjectVersion: { Ref: 'LambdaS3ObjectVersion' },
          },
          Handler: 'index.handler',
          Layers: [
            {
              'Fn::ImportValue': lambdaLayerStackName,
            },
          ],
          MemorySize: 512,
          Role: {
            'Fn::GetAtt': [AppSyncLambdaFunctionIAMRoleLogicalId, 'Arn'],
          },
          Runtime: 'nodejs18.x',
          /**
           * https://docs.aws.amazon.com/general/latest/gr/appsync.html
           * Request execution time for mutations, queries, and subscriptions: 30 seconds
           */
          Timeout: 29,
        },
      },
      [AppSyncLambdaFunctionAppSyncDataSourceIAMRoleLogicalId]: {
        Type: 'AWS::IAM::Role',
        Properties: {
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: 'sts:AssumeRole',
                Principal: {
                  Service: 'appsync.amazonaws.com',
                },
              },
            ],
          },
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/service-role/AWSAppSyncPushToCloudWatchLogs',
          ],
          Path: '/custom-iam/',
          Policies: [
            {
              PolicyName: 'AppSyncGraphQLApiIAMRolePolicyName',
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['lambda:InvokeFunction'],
                    Resource: [
                      { 'Fn::GetAtt': [AppSyncLambdaFunctionLogicalId, 'Arn'] },
                    ],
                  },
                ],
              },
            },
          ],
        },
      },
      [AppSyncLambdaFunctionAppSyncDataSourceLogicalId]: {
        Type: 'AWS::AppSync::DataSource',
        Properties: {
          ApiId: { 'Fn::GetAtt': [AppSyncGraphQLApiLogicalId, 'ApiId'] },
          LambdaConfig: {
            LambdaFunctionArn: {
              'Fn::GetAtt': [AppSyncLambdaFunctionLogicalId, 'Arn'],
            },
          },
          Name: 'AppSyncLambdaFunctionAppSyncDataSource',
          ServiceRoleArn: {
            'Fn::GetAtt': [
              AppSyncLambdaFunctionAppSyncDataSourceIAMRoleLogicalId,
              'Arn',
            ],
          },
          Type: 'AWS_LAMBDA',
        },
      },
    },
    Outputs: {
      [AppSyncGraphQLApiLogicalId]: {
        Value: {
          'Fn::GetAtt': [AppSyncGraphQLApiLogicalId, 'GraphQLUrl'],
        },
      },
    },
  };

  resolveMethodsEntries.forEach(({ fieldName, typeName }) => {
    template.Resources[`${fieldName}${typeName}AppSyncResolver`] = {
      Type: 'AWS::AppSync::Resolver',
      DependsOn: AppSyncGraphQLSchemaLogicalId,
      Properties: {
        ApiId: { 'Fn::GetAtt': [AppSyncGraphQLApiLogicalId, 'ApiId'] },
        FieldName: fieldName,
        TypeName: typeName,
        DataSourceName: {
          'Fn::GetAtt': [
            AppSyncLambdaFunctionAppSyncDataSourceLogicalId,
            'Name',
          ],
        },
      },
    };
  });

  return template;
};
