const projectName = 'MyProjectNameForTesting';

jest.mock('../../src/utils', () => {
  return {
    ...jest.requireActual('../../src/utils'),
    getEnvironment: jest.fn().mockReturnValue(undefined),
    getProjectName: jest.fn().mockReturnValue(projectName),
    getCurrentBranch: jest.fn().mockReturnValue('main'),
  };
});

import type { CloudFormationTemplate } from '@ttoss/cloudformation';
import {
  addDefaults,
  type CloudFormationParams,
  CRITICAL_RESOURCES_TYPES,
} from 'src/deploy/addDefaults.cloudformation';
import { getCurrentBranch, getEnvironment, getProjectName } from 'src/utils';

beforeEach(() => {
  (getEnvironment as jest.Mock).mockReturnValue(undefined);
  (getProjectName as jest.Mock).mockReturnValue(projectName);
  (getCurrentBranch as jest.Mock).mockReturnValue('main');
});

test.each<{
  originalTemplate: CloudFormationTemplate;
  params: CloudFormationParams;
  finalTemplate: CloudFormationTemplate;
}>([
  {
    originalTemplate: {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        MyFunction: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            FunctionName: 'my-function',
            Handler: 'index.handler',
            Runtime: 'nodejs14.x',
            Code: {
              ZipFile:
                'exports.handler = async (event) => { return "Hello World"; };',
            },
          },
        },
      },
    },
    params: {
      StackName: 'stackName',
      Parameters: [],
      Tags: [],
    },
    finalTemplate: {
      AWSTemplateFormatVersion: '2010-09-09',
      Parameters: {
        Project: {
          Default: 'MyProjectNameForTesting',
          Type: 'String',
        },
      },
      Resources: {
        MyFunction: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            FunctionName: 'my-function',
            Handler: 'index.handler',
            Runtime: 'nodejs14.x',
            Code: {
              ZipFile:
                'exports.handler = async (event) => { return "Hello World"; };',
            },
          },
        },
        MyFunctionLogsLogGroup: {
          DeletionPolicy: 'Delete',
          Properties: {
            LogGroupName: {
              'Fn::Join': [
                '/',
                [
                  '/aws/lambda',
                  {
                    Ref: 'MyFunction',
                  },
                ],
              ],
            },
            RetentionInDays: 14,
          },
          Type: 'AWS::Logs::LogGroup',
        },
      },
    },
  },
])(
  'should transform CloudFormation template',
  async ({ originalTemplate, finalTemplate, params }) => {
    const newTemplate = await addDefaults({
      params,
      template: originalTemplate,
    });
    expect(newTemplate.template).toEqual(finalTemplate);
  }
);

test.each([
  {
    originalBranchName: 'main',
    finalBranchName: 'main',
  },
  {
    originalBranchName: 'feature/branch/with/slashes',
    finalBranchName: 'feature/branch/with/slashes',
  },
  {
    originalBranchName: 'fix_export_table_#520',
    finalBranchName: 'fix_export_table_520',
  },
])(
  'should add defaults to parameters and tags',
  async ({ originalBranchName, finalBranchName }) => {
    (getCurrentBranch as jest.Mock).mockReturnValue(originalBranchName);

    const params = {
      StackName: 'stackName',
      Parameters: [],
      Tags: [],
    };

    const newParams = await addDefaults({
      params,
      template: {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {},
      },
    });

    expect(newParams.params).toEqual({
      StackName: 'stackName',
      Parameters: [
        {
          ParameterKey: 'Project',
          ParameterValue: projectName,
        },
      ],
      Tags: [
        {
          Key: 'Branch',
          Value: finalBranchName,
        },
        {
          Key: 'Project',
          Value: projectName,
        },
      ],
    });
  }
);

test('should have critical resources types', () => {
  expect(CRITICAL_RESOURCES_TYPES).toContain('AWS::Cognito::UserPool');
  expect(CRITICAL_RESOURCES_TYPES).toContain('AWS::DynamoDB::Table');
});

describe('add default parameters to template', () => {
  const params = { StackName: 'stackName' };

  const template: CloudFormationTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Parameters: {
      MyParameter: {
        Type: 'String',
        Default: 'MyParameterDefault',
      },
    },
    Resources: {
      AppSyncGraphQLApi: {
        Type: 'AWS::AppSync::GraphQLApi',
        Properties: {},
      },
      CognitoUserPool: {
        Type: 'AWS::Cognito::UserPool',
        Properties: {},
      },
    },
  };

  test('should add project to template', async () => {
    const newTemplate = (await addDefaults({ params, template })).template;
    expect(newTemplate.Parameters).toEqual({
      MyParameter: {
        Default: 'MyParameterDefault',
        Type: 'String',
      },
      Project: {
        Default: projectName,
        Type: 'String',
      },
    });
  });

  test('should add project and environment to template', async () => {
    (getEnvironment as jest.Mock).mockReturnValue('Production');
    const newTemplate = (await addDefaults({ params, template })).template;
    expect(newTemplate.Parameters).toEqual({
      Environment: {
        Default: 'Production',
        Type: 'String',
      },
      MyParameter: {
        Default: 'MyParameterDefault',
        Type: 'String',
      },
      Project: {
        Default: projectName,
        Type: 'String',
      },
    });
  });
});

describe('retain deletion policy', () => {
  const params = { StackName: 'stackName' };

  const template: CloudFormationTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: {
      AppSyncGraphQLApi: {
        Type: 'AWS::AppSync::GraphQLApi',
        Properties: {},
      },
      CognitoUserPool: {
        Type: 'AWS::Cognito::UserPool',
        Properties: {},
      },
    },
  };

  test('should add retain to deletion policy if environment is set', async () => {
    (getEnvironment as jest.Mock).mockReturnValue('Production');

    const newTemplate = (await addDefaults({ params, template })).template;

    expect(newTemplate.Resources.CognitoUserPool.DeletionPolicy).toEqual(
      'Retain'
    );
  });

  test('should NOT add retain to deletion policy if environment is NOT set', async () => {
    const newTemplate = (await addDefaults({ params, template })).template;

    expect(newTemplate.Resources.CognitoUserPool.DeletionPolicy).toEqual(
      undefined
    );
  });

  test('should NOT add retain to deletion policy if environment is set and DeletionPolicy is set', async () => {
    (getEnvironment as jest.Mock).mockReturnValue('Production');

    const copyTemplate = JSON.parse(JSON.stringify(template));

    copyTemplate.Resources.CognitoUserPool.DeletionPolicy = 'Delete';

    const newTemplate = (await addDefaults({ params, template: copyTemplate }))
      .template;

    expect(newTemplate.Resources.CognitoUserPool.DeletionPolicy).toEqual(
      'Delete'
    );
  });
});

describe('testing template update', () => {
  test.each<[string, CloudFormationTemplate, Partial<CloudFormationTemplate>]>([
    [
      'add AppSync outputs',
      {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          AppSyncGraphQLApi: {
            Type: 'AWS::AppSync::GraphQLApi',
            Properties: {},
          },
        },
      },
      {
        Outputs: {
          AppSyncGraphQLApi: {
            Description: expect.any(String),
            Value: { 'Fn::GetAtt': ['AppSyncGraphQLApi', 'GraphQLUrl'] },
            Export: {
              Name: {
                'Fn::Join': [':', [{ Ref: 'AWS::StackName' }, 'GraphQLApiUrl']],
              },
            },
          },
        },
      },
    ],
  ])('%s', async (_, template, newTemplate) => {
    const params = { StackName: 'stackName' };
    expect((await addDefaults({ params, template })).template).toEqual(
      expect.objectContaining(newTemplate)
    );
  });
});
