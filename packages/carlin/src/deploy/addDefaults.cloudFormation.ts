import { CloudFormation } from 'aws-sdk';

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

type CloudFormationParams =
  | CloudFormation.CreateStackInput
  | CloudFormation.UpdateStackInput;

export type Args = {
  params: CloudFormationParams;
  template: CloudFormationTemplate;
};

type TemplateModifier = (
  template: CloudFormationTemplate,
) => Promise<CloudFormationTemplate>;

const addDefaultsParametersAndTagsToParams = async (
  params: CloudFormationParams,
): Promise<CloudFormationParams> => {
  const branchName = await getCurrentBranch();
  const environment = await getEnvironment();
  const packageName = await getPackageName();
  const packageVersion = await getPackageVersion();
  const projectName = await getProjectName();

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
    ].filter(({ Value }) => !!Value),
  };
};

const addDefaultParametersToTemplate: TemplateModifier = async (template) => {
  const [environment, projectName] = await Promise.all([
    getEnvironment(),
    getProjectName(),
  ]);

  const newParameters: any = {
    Project: { Default: projectName, Type: 'String' },
  };

  if (environment) {
    newParameters.Environment = { Default: environment, Type: 'String' };
  }

  const newTemplate = {
    ...template,
    Parameters: { ...newParameters, ...template.Parameters },
  };

  return newTemplate;
};

const addLogGroupToResources = (
  template: CloudFormationTemplate,
): CloudFormationTemplate => {
  const { Resources } = template;

  const resourcesEntries = Object.entries(Resources);

  resourcesEntries.forEach(([key, resource]) => {
    if (
      ['AWS::Lambda::Function', 'AWS::Serverless::Function'].includes(
        resource.Type,
      )
    ) {
      /**
       * Check if exist a resource on template whose LogGroupName
       * Properties includes the Lambda logical id.
       */
      const logGroup = resourcesEntries.find(([, resource2]) => {
        const logGroupNameStr = JSON.stringify(
          resource2.Properties?.LogGroupName?.['Fn::Join'] || '',
        );
        return logGroupNameStr.includes(key);
      });

      if (!logGroup) {
        Resources[`${key}LogsLogGroup`] = {
          Type: 'AWS::Logs::LogGroup',
          DeletionPolicy: 'Delete',
          Properties: {
            LogGroupName: { 'Fn::Join': ['/', ['/aws/lambda', { Ref: key }]] },
          },
        };
      }
    }
  });

  return template;
};

const addEnvironmentsToLambdaResources: TemplateModifier = async (template) => {
  const environment = getEnvironment();

  const { Resources } = template;

  const resourcesEntries = Object.entries(Resources);

  resourcesEntries.forEach(([, resource]) => {
    if (resource.Type === 'AWS::Lambda::Function') {
      const { Properties } = resource;

      /**
       * Lambda@Edege does not support environment variables.
       * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-requirements-limits.html#lambda-requirements-lambda-function-configuration
       * Then every function that has "Lambda@Edge" in its description will not
       * have the variables passed to Environment.Variables.
       */
      if (((Properties.Description as string) || '').includes('Lambda@Edge')) {
        return;
      }

      if (!environment) {
        return;
      }

      if (!Properties.Environment) {
        Properties.Environment = {};
      }

      if (!Properties.Environment.Variables) {
        Properties.Environment.Variables = {};
      }

      Properties.Environment.Variables.ENVIRONMENT = environment;
    }
  });

  return template;
};

const addAppSyncApiOutputs: TemplateModifier = async (template) => {
  const newTemplate = { ...template };

  Object.entries(template.Resources).forEach(([key, resource]) => {
    if (resource.Type === 'AWS::AppSync::GraphQLApi') {
      newTemplate.Outputs = {
        [key]: {
          Description: `Automatically added by ${NAME}`,
          Value: { 'Fn::GetAtt': [key, 'GraphQLUrl'] },
          Export: {
            Name: {
              'Fn::Join': [':', [{ Ref: 'AWS::StackName' }, 'GraphQLApiUrl']],
            },
          },
        },
        ...newTemplate.Outputs,
      };
    }
  });

  return newTemplate;
};

export const addDefaults = async ({
  params,
  template,
}: Args): Promise<Args> => {
  const newTemplate = await [
    addDefaultParametersToTemplate,
    addLogGroupToResources,
    addEnvironmentsToLambdaResources,
    addAppSyncApiOutputs,
  ].reduce(async (acc, addFn) => addFn(await acc), Promise.resolve(template));

  const response = {
    params: await addDefaultsParametersAndTagsToParams(params),
    template: newTemplate,
  };

  return response;
};
