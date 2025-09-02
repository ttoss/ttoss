import {
  CreateStackCommandInput,
  UpdateStackCommandInput,
} from '@aws-sdk/client-cloudformation';

import { NAME } from '../config';
import {
  CloudFormationTemplate,
  getCurrentBranch,
  getEnvironment,
  getPackageName,
  getPackageVersion,
  getProjectName,
} from '../utils';

// const logPrefix = 'addDefaultsCloudFormation';

type CloudFormationParams = CreateStackCommandInput | UpdateStackCommandInput;

export type Args = {
  params: CloudFormationParams;
  template: CloudFormationTemplate;
};

type TemplateModifier = (template: CloudFormationTemplate) => Promise<void>;

const addDefaultsParametersAndTagsToParams = async (
  params: CloudFormationParams
): Promise<CloudFormationParams> => {
  const branchName = await getCurrentBranch();
  const environment = await getEnvironment();
  const packageName = await getPackageName();
  const packageVersion = await getPackageVersion();
  const projectName = await getProjectName();

  /**
   * https://docs.aws.amazon.com/directoryservice/latest/devguide/API_Tag.html
   */
  const tagValuePattern = /[^a-zA-Z0-9_.:/=+\-@]/g;

  return {
    ...params,
    Parameters: [
      ...(params.Parameters || []),
      ...(environment
        ? [{ ParameterKey: 'Environment', ParameterValue: environment }]
        : []),
      { ParameterKey: 'Project', ParameterValue: projectName },
    ],
    Tags: [
      ...(params.Tags || []),
      { Key: 'Branch', Value: branchName },
      ...(environment ? [{ Key: 'Environment', Value: environment }] : []),
      { Key: 'Package', Value: packageName },
      { Key: 'Project', Value: projectName },
      { Key: 'Version', Value: packageVersion },
    ]
      .filter(({ Value }) => {
        return !!Value;
      })
      /**
       * Remove invalid characters from tags values.
       */
      .map(({ Key, Value }) => {
        return {
          Key,
          Value: Value.replace(tagValuePattern, ''),
        };
      }),
  };
};

const addDefaultParametersToTemplate: TemplateModifier = async (template) => {
  const [environment, projectName] = await Promise.all([
    getEnvironment(),
    getProjectName(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newParameters: any = {
    Project: { Default: projectName, Type: 'String' },
  };

  if (environment) {
    newParameters.Environment = { Default: environment, Type: 'String' };
  }

  template.Parameters = { ...newParameters, ...template.Parameters };
};

const addLogGroupToResources = (template: CloudFormationTemplate) => {
  const { Resources } = template;

  const resourcesEntries = Object.entries(Resources);

  for (const [key, resource] of resourcesEntries) {
    if (
      ['AWS::Lambda::Function', 'AWS::Serverless::Function'].includes(
        resource.Type
      )
    ) {
      /**
       * Check if exist a resource on template whose LogGroupName
       * Properties includes the Lambda logical id.
       */
      const logGroup = resourcesEntries.find(([, resource2]) => {
        const logGroupNameStr = JSON.stringify(
          resource2.Properties?.LogGroupName?.['Fn::Join'] || ''
        );
        return logGroupNameStr.includes(key);
      });

      if (!logGroup) {
        Resources[`${key}LogsLogGroup`] = {
          Type: 'AWS::Logs::LogGroup',
          DeletionPolicy: 'Delete',
          Properties: {
            LogGroupName: { 'Fn::Join': ['/', ['/aws/lambda', { Ref: key }]] },
            RetentionInDays: 14,
          },
        };
      }
    }
  }
};

const addEnvironmentsToLambdaResources: TemplateModifier = async (template) => {
  const environment = getEnvironment();

  const { Resources } = template;

  const resourcesEntries = Object.entries(Resources);

  for (const [, resource] of resourcesEntries) {
    if (resource.Type === 'AWS::Lambda::Function') {
      const { Properties } = resource;

      /**
       * Lambda@Edege does not support environment variables.
       * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-requirements-limits.html#lambda-requirements-lambda-function-configuration
       * Then every function that has "Lambda@Edge" in its description will not
       * have the variables passed to Environment.Variables.
       */
      if (((Properties.Description as string) || '').includes('Lambda@Edge')) {
        continue;
      }

      if (!environment) {
        continue;
      }

      if (!Properties.Environment) {
        Properties.Environment = {};
      }

      if (!Properties.Environment.Variables) {
        Properties.Environment.Variables = {};
      }

      Properties.Environment.Variables.ENVIRONMENT = environment;
    }
  }
};

export const CRITICAL_RESOURCES_TYPES = [
  'AWS::Cognito::UserPool',
  'AWS::DynamoDB::Table',
];

/**
 * Generally, critical resources are those that contain user data, such as
 * Amazon Cognito user pools or DynamoDB tables. If you delete these resources,
 * you might lose user data that cannot be recovered.
 */
const addRetainToCriticalResources: TemplateModifier = async (template) => {
  const environment = getEnvironment();

  for (const [, resource] of Object.entries(template.Resources)) {
    if (CRITICAL_RESOURCES_TYPES.includes(resource.Type)) {
      if (!resource.DeletionPolicy && environment) {
        resource.DeletionPolicy = 'Retain';
      }
    }
  }
};

const addAppSyncApiOutputs: TemplateModifier = async (template) => {
  for (const [key, resource] of Object.entries(template.Resources)) {
    if (resource.Type === 'AWS::AppSync::GraphQLApi') {
      template.Outputs = {
        [key]: {
          Description: `Automatically added by ${NAME}`,
          Value: { 'Fn::GetAtt': [key, 'GraphQLUrl'] },
          Export: {
            Name: {
              'Fn::Join': [':', [{ Ref: 'AWS::StackName' }, 'GraphQLApiUrl']],
            },
          },
        },
        ...template.Outputs,
      };
    }
  }
};

export const addDefaults = async ({
  params,
  template,
}: Args): Promise<Args> => {
  const newTemplate = JSON.parse(JSON.stringify(template));

  await addDefaultParametersToTemplate(newTemplate);
  await addLogGroupToResources(newTemplate);
  await addEnvironmentsToLambdaResources(newTemplate);
  await addAppSyncApiOutputs(newTemplate);
  await addRetainToCriticalResources(newTemplate);

  const response = {
    params: await addDefaultsParametersAndTagsToParams(params),
    template: newTemplate,
  };

  return response;
};
