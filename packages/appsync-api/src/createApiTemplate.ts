import { type SchemaComposer, graphql } from 'graphql-compose';
import { getPackageLambdaLayerStackName } from 'carlin/src/deploy/lambdaLayer/getPackageLambdaLayerStackName';
import packageJson from '../package.json';
import type { CloudFormationTemplate } from '@ttoss/cloudformation';

const AppSyncGraphQLApiLogicalId = 'AppSyncGraphQLApi';

export const AppSyncGraphQLSchemaLogicalId = 'AppSyncGraphQLSchema';

export const AppSyncLambdaFunctionLogicalId = 'AppSyncLambdaFunction';

const AppSyncLambdaFunctionAppSyncDataSourceLogicalId =
  'AppSyncLambdaFunctionAppSyncDataSource';

type Role =
  | string
  | {
      'Fn::ImportValue': string;
    };

export const createApiTemplate = ({
  schemaComposer,
  dataSource,
  lambdaFunction,
}: {
  schemaComposer: SchemaComposer<any>;
  dataSource: {
    roleArn: Role;
  };
  lambdaFunction: {
    roleArn: Role;
  };
}): CloudFormationTemplate => {
  /**
   * It should be on top of the file, otherwise it will have empty Mutation
   * or Subscription if there are no resolvers for them.
   */
  const sdl = schemaComposer.toSDL();

  graphql.validateSchema(schemaComposer.buildSchema());

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

  const getGraphQLComposeDependenciesLambdaLayers = () => {
    const { peerDependencies } = packageJson;

    const lambdaLayerStackNames = Object.entries(peerDependencies).map(
      ([dependencyName, dependencyVersion]) => {
        return getPackageLambdaLayerStackName(
          [dependencyName, dependencyVersion].join('@')
        );
      }
    );

    return lambdaLayerStackNames.map((lambdaLayerStackName) => {
      return {
        'Fn::ImportValue': lambdaLayerStackName,
      };
    });
  };

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
      [AppSyncLambdaFunctionLogicalId]: {
        Type: 'AWS::Lambda::Function',
        Properties: {
          Code: {
            S3Bucket: { Ref: 'LambdaS3Bucket' },
            S3Key: { Ref: 'LambdaS3Key' },
            S3ObjectVersion: { Ref: 'LambdaS3ObjectVersion' },
          },
          Handler: 'index.handler',
          Layers: getGraphQLComposeDependenciesLambdaLayers(),
          MemorySize: 512,
          Role: lambdaFunction.roleArn,
          Runtime: 'nodejs18.x',
          /**
           * https://docs.aws.amazon.com/general/latest/gr/appsync.html
           * Request execution time for mutations, queries, and subscriptions: 30 seconds
           */
          Timeout: 29,
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
          ServiceRoleArn: dataSource.roleArn,
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
