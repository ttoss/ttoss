import { graphql, type SchemaComposer } from '@ttoss/graphql-api';

/**
 * Absolute path to avoid:
 * The inferred type of 'template' cannot be named without a reference to
 * '@ttoss/appsync-api/node_modules/@ttoss/cloudformation'. This is likely not
 * portable. A type annotation is necessary.ts(2742)
 */
import type { CloudFormationTemplate } from '../../cloudformation/src/';

export const AppSyncGraphQLApiLogicalId = 'AppSyncGraphQLApi';

export const AppSyncGraphQLSchemaLogicalId = 'AppSyncGraphQLSchema';

export const AppSyncLambdaFunctionLogicalId = 'AppSyncLambdaFunction';

const AppSyncLambdaFunctionAppSyncDataSourceLogicalId =
  'AppSyncLambdaFunctionAppSyncDataSource';

export const AppSyncGraphQLApiKeyLogicalId = 'AppSyncGraphQLApiKey';

/**
 * A CloudFormation value that can be a plain string or any standard CF
 * intrinsic function. Use this type when declaring values that may reference
 * parameters, imports, or other resources.
 *
 * - `string` – a literal string value.
 * - `{ Ref }` – references a parameter or resource by logical ID.
 * - `{ 'Fn::ImportValue' }` – imports a cross-stack export by name.
 * - `{ 'Fn::Sub' }` – substitutes variables (e.g. `${Param}`) in a string.
 * - `{ 'Fn::GetAtt' }` – retrieves an attribute from another resource.
 * - `{ 'Fn::If' }` – conditionally returns one of two values.
 * - `{ 'Fn::Join' }` – joins a list of values with a delimiter.
 * - `{ 'Fn::Select' }` – selects a value from a list by index.
 */
export type CfIntrinsic =
  | string
  | { Ref: string }
  | { 'Fn::ImportValue': string | { 'Fn::Sub': string } }
  | { 'Fn::Sub': string | [string, Record<string, CfIntrinsic>] }
  | { 'Fn::GetAtt': [string, string] }
  | { 'Fn::If': [string, CfIntrinsic, CfIntrinsic] }
  | { 'Fn::Join': [string, CfIntrinsic[]] }
  | { 'Fn::Select': [number, CfIntrinsic[]] };

/**
 * Helper to build an `Fn::ImportValue` + `Fn::Sub` reference for a
 * CloudFormation parameter. Useful for referencing cross-stack exports whose
 * names are parameterised.
 *
 * @example
 * ```ts
 * const value = importValueFromParameter('MyStackExportParam');
 * // { 'Fn::ImportValue': { 'Fn::Sub': '${MyStackExportParam}' } }
 * ```
 */
export const importValueFromParameter = (
  parameterName: string
): CfIntrinsic => {
  return {
    'Fn::ImportValue': {
      'Fn::Sub': `\${${parameterName}}`,
    },
  };
};

type StringOrImport = CfIntrinsic;

/**
 * https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html
 */
type AuthenticationType =
  | 'API_KEY'
  | 'AWS_LAMBDA'
  | 'AWS_IAM'
  | 'OPENID_CONNECT'
  | 'AMAZON_COGNITO_USER_POOLS';

export const createApiTemplate = ({
  additionalAuthenticationProviders,
  authenticationType = 'AMAZON_COGNITO_USER_POOLS',
  schemaComposer,
  dataSource,
  lambdaFunction,
  userPoolConfig,
  customDomain,
}: {
  additionalAuthenticationProviders?: AuthenticationType[];
  authenticationType?: AuthenticationType;
  customDomain?: {
    domainName: CfIntrinsic;
    certificateArn: CfIntrinsic;
    hostedZoneName?: string;
    /**
     * When `true`, `createApiTemplate` will:
     * 1. Add `CertificateArn` (Default: '') and `DomainName` (Default: '')
     *    to the template Parameters.
     * 2. Add a `HasCustomDomain` Condition that is true only when both
     *    parameters are non-empty.
     * 3. Apply `Condition: HasCustomDomain` to all domain-related resources
     *    (AppSyncDomainName, AppSyncDomainNameApiAssociation,
     *     AppSyncDomainNameRoute53RecordSet).
     *
     * This allows the stack to be deployed without providing a custom domain.
     */
    optional?: boolean;
  };
  dataSource: {
    roleArn: StringOrImport;
  };
  lambdaFunction: {
    environment?: {
      variables: Record<string, string>;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layers?: any;
    roleArn: StringOrImport;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schemaComposer: SchemaComposer<any>;
  userPoolConfig?: {
    appIdClientRegex: StringOrImport;
    awsRegion: StringOrImport;
    defaultAction: 'ALLOW' | 'DENY';
    userPoolId: StringOrImport;
  };
}): CloudFormationTemplate => {
  /**
   * It should be on top of the file, otherwise it will have empty Mutation
   * or Subscription if there are no resolvers for them.
   */
  const sdlWithoutComments = schemaComposer.toSDL({
    commentDescriptions: false,
    omitDescriptions: true,
    omitScalars: true,
  });

  graphql.validateSchema(schemaComposer.buildSchema());

  /**
   * Get FieldName and TypeName. `resolveMethods` is a Map of
   * `typeName: { fieldName: resolverFn }`
   */
  const resolveMethods = schemaComposer.getResolveMethods();

  const resolveMethodsEntries = Object.entries(resolveMethods)
    .flatMap(([typeName, fieldResolvers]) => {
      return Object.entries(fieldResolvers).map(([fieldName, resolver]) => {
        if (typeof resolver !== 'function') {
          return undefined;
        }

        if (typeName.toLowerCase().includes('enum')) {
          return undefined;
        }

        return {
          fieldName,
          typeName,
        };
      });
    })
    .filter(Boolean) as Array<{ fieldName: string; typeName: string }>;

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
      /**
       * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-appsync-graphqlapi.html#cfn-appsync-graphqlapi-name
       */
      [AppSyncGraphQLApiLogicalId]: {
        Type: 'AWS::AppSync::GraphQLApi',
        Properties: {
          AuthenticationType: authenticationType,
          Name: {
            Ref: 'AWS::StackName',
          },
        },
      },
      [AppSyncGraphQLSchemaLogicalId]: {
        Type: 'AWS::AppSync::GraphQLSchema',
        Properties: {
          ApiId: { 'Fn::GetAtt': [AppSyncGraphQLApiLogicalId, 'ApiId'] },
          Definition: sdlWithoutComments,
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
          Layers: lambdaFunction.layers,
          MemorySize: 512,
          Role: lambdaFunction.roleArn,
          /**
           * https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html#runtimes-supported
           */
          Runtime: 'nodejs24.x',
          /**
           * https://docs.aws.amazon.com/general/latest/gr/appsync.html
           * Request execution time for mutations, queries, and subscriptions: 30 seconds
           */
          Timeout: 30,
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
      AppSyncApiGraphQLUrl: {
        Export: {
          Name: {
            'Fn::Join': [
              ':',
              [{ Ref: 'AWS::StackName' }, 'AppSyncApiGraphQLUrl'],
            ],
          },
        },
        Value: {
          'Fn::GetAtt': [AppSyncGraphQLApiLogicalId, 'GraphQLUrl'],
        },
      },
      AppSyncApiArn: {
        Export: {
          Name: {
            'Fn::Join': [':', [{ Ref: 'AWS::StackName' }, 'AppSyncApiArn']],
          },
        },
        Value: {
          'Fn::GetAtt': [AppSyncGraphQLApiLogicalId, 'Arn'],
        },
      },
    },
  };

  for (const { fieldName, typeName } of resolveMethodsEntries) {
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
  }

  const apiKey =
    additionalAuthenticationProviders?.includes('API_KEY') ||
    authenticationType === 'API_KEY';

  const cognitoUserPoolAuth =
    additionalAuthenticationProviders?.includes('AMAZON_COGNITO_USER_POOLS') ||
    authenticationType === 'AMAZON_COGNITO_USER_POOLS';

  if (additionalAuthenticationProviders) {
    template.Resources[AppSyncGraphQLApiLogicalId].Properties = {
      ...template.Resources[AppSyncGraphQLApiLogicalId].Properties,
      AdditionalAuthenticationProviders: additionalAuthenticationProviders?.map(
        (provider) => {
          return {
            AuthenticationType: provider,
          };
        }
      ),
    };
  }

  if (apiKey) {
    template.Resources[AppSyncGraphQLApiKeyLogicalId] = {
      Type: 'AWS::AppSync::ApiKey',
      Properties: {
        ApiId: { 'Fn::GetAtt': [AppSyncGraphQLApiLogicalId, 'ApiId'] },
      },
    };

    if (!template.Outputs) {
      template.Outputs = {};
    }

    template.Outputs[AppSyncGraphQLApiKeyLogicalId] = {
      Value: {
        'Fn::GetAtt': [AppSyncGraphQLApiKeyLogicalId, 'ApiKey'],
      },
    };
  }

  if (cognitoUserPoolAuth) {
    if (!userPoolConfig) {
      throw new Error(
        'userPoolConfig is required when using AMAZON_COGNITO_USER_POOLS authentication.'
      );
    }

    template.Resources[AppSyncGraphQLApiLogicalId].Properties = {
      ...template.Resources[AppSyncGraphQLApiLogicalId].Properties,
      UserPoolConfig: {
        AppIdClientRegex: userPoolConfig.appIdClientRegex,
        AwsRegion: userPoolConfig.awsRegion,
        DefaultAction: userPoolConfig.defaultAction,
        UserPoolId: userPoolConfig.userPoolId,
      },
    };
  }

  if (lambdaFunction.environment?.variables) {
    template.Resources[AppSyncLambdaFunctionLogicalId].Properties = {
      ...template.Resources[AppSyncLambdaFunctionLogicalId].Properties,
      Environment: {
        Variables: lambdaFunction.environment.variables,
      },
    };
  }

  if (customDomain) {
    const AppSyncDomainNameLogicalId = 'AppSyncDomainName';
    const hasCustomDomainCondition = 'HasCustomDomain';

    let domainName: CfIntrinsic = customDomain.domainName;
    let certificateArn: CfIntrinsic = customDomain.certificateArn;

    if (customDomain.optional) {
      /**
       * Add CertificateArn and DomainName as Parameters with empty defaults so
       * the stack can be deployed without providing a custom domain.
       */
      if (!template.Parameters) {
        template.Parameters = {};
      }

      template.Parameters.CertificateArn = {
        Type: 'String',
        Default: '',
      };

      template.Parameters.DomainName = {
        Type: 'String',
        Default: '',
      };

      /**
       * Condition that is true only when both parameters are non-empty.
       */
      if (!template.Conditions) {
        template.Conditions = {};
      }

      template.Conditions[hasCustomDomainCondition] = {
        'Fn::And': [
          { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'CertificateArn' }, ''] }] },
          { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'DomainName' }, ''] }] },
        ],
      };

      domainName = { Ref: 'DomainName' };
      certificateArn = { Ref: 'CertificateArn' };
    }

    /**
     * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-appsync-domainname.html
     */
    template.Resources[AppSyncDomainNameLogicalId] = {
      Type: 'AWS::AppSync::DomainName',
      ...(customDomain.optional && { Condition: hasCustomDomainCondition }),
      Properties: {
        CertificateArn: certificateArn,
        Description: 'Custom domain for AppSync API',
        DomainName: domainName,
      },
    };

    if (customDomain.hostedZoneName) {
      const hostedZoneName = customDomain.hostedZoneName.endsWith('.')
        ? customDomain.hostedZoneName
        : `${customDomain.hostedZoneName}.`;

      /**
       * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-route53-recordset.html
       */
      template.Resources.AppSyncDomainNameRoute53RecordSet = {
        Type: 'AWS::Route53::RecordSet',
        ...(customDomain.optional && { Condition: hasCustomDomainCondition }),
        Properties: {
          HostedZoneName: hostedZoneName,
          Name: domainName,
          ResourceRecords: [
            {
              'Fn::GetAtt': [AppSyncDomainNameLogicalId, 'AppSyncDomainName'],
            },
          ],
          TTL: '900',
          Type: 'CNAME',
        },
      };
    }

    template.Resources.AppSyncDomainNameApiAssociation = {
      Type: 'AWS::AppSync::DomainNameApiAssociation',
      ...(customDomain.optional && { Condition: hasCustomDomainCondition }),
      Properties: {
        ApiId: {
          'Fn::GetAtt': [AppSyncGraphQLApiLogicalId, 'ApiId'],
        },
        DomainName: {
          'Fn::GetAtt': [AppSyncDomainNameLogicalId, 'DomainName'],
        },
      },
    };

    if (!template.Outputs) {
      template.Outputs = {};
    }

    template.Outputs.DomainName = {
      Description: 'Custom domain name for AppSync API',
      ...(customDomain.optional && { Condition: hasCustomDomainCondition }),
      Value: {
        'Fn::GetAtt': [AppSyncDomainNameLogicalId, 'DomainName'],
      },
    };

    template.Outputs.CloudFrontDomainName = {
      Description: 'CloudFront domain name for AppSync API',
      ...(customDomain.optional && { Condition: hasCustomDomainCondition }),
      Value: {
        'Fn::GetAtt': [AppSyncDomainNameLogicalId, 'AppSyncDomainName'],
      },
    };
  }

  return template;
};
