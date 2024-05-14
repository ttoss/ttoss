/* eslint-disable no-var */
import { CloudFormationTemplate } from '../../src/utils/cloudFormationTemplate';
import { buildLambdaCode } from '../../src/deploy/lambda/buildLambdaCode';
import { deploy } from '../../src/deploy/cloudformation.core';
import { deployLambdaCode } from '../../src/deploy/lambda/deployLambdaCode';
import { faker } from '@ttoss/test-utils/faker';
import { getStackName } from '../../src/deploy/stackName';

const mockWorkingCloudFormationTemplate: CloudFormationTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Resources: {
    SomeResource: {
      Type: faker.lorem.word(),
      Properties: {},
    },
  },
};

jest.mock('../../src/deploy/cloudformation.core', () => {
  return {
    ...jest.requireActual('../../src/deploy/cloudformation.core'),
    deploy: jest.fn(),
    validateTemplate: jest.fn(),
    cloudFormationV2: jest.fn().mockReturnValue({
      validateTemplate: jest.fn(() => {
        return {
          promise: () => {
            return Promise.resolve();
          },
        };
      }),
    }),
  };
});

jest.mock('../../src/deploy/lambda/deployLambdaCode', () => {
  return {
    deployLambdaCode: jest.fn(),
  };
});

jest.mock('../../src/deploy/stackName', () => {
  return {
    getStackName: jest.fn(),
  };
});

jest.mock('../../src/deploy/lambda/buildLambdaCode', () => {
  return {
    buildLambdaCode: jest.fn(),
  };
});

import {
  defaultTemplatePaths,
  deployCloudFormation,
} from '../../src/deploy/cloudformation';

const mockStackName = faker.word.sample();

beforeAll(() => {
  (getStackName as jest.Mock).mockReturnValue(mockStackName);
});

test('all templates paths should start with .src', () => {
  defaultTemplatePaths.forEach((path) => {
    expect(path.startsWith('./src/cloudformation.')).toBeTruthy();
  });
});

const lambdaEntryPoints = [faker.word.sample(), faker.word.sample()];

const lambdaExternal = [...new Array(5)].map(() => {
  return faker.word.sample();
});

test('return working cloudformation template if passed via template', async () => {
  (deployLambdaCode as jest.Mock).mockResolvedValueOnce(undefined);

  await deployCloudFormation({
    template: mockWorkingCloudFormationTemplate,
    lambdaEntryPoints: [],
    lambdaEntryPointsBaseDir: 'src',
    lambdaOutdir: 'dist',
    lambdaExternal: [],
  });

  expect(deploy).toHaveBeenCalledWith({
    params: {
      Parameters: [],
      StackName: mockStackName,
    },
    template: mockWorkingCloudFormationTemplate,
  });
});

test('add Lambda S3 Parameters on CloudFormation template', async () => {
  const deployLambdaCodeResponse = {
    bucket: faker.lorem.word(),
    key: faker.lorem.word(),
    versionId: faker.lorem.word(),
  };

  (deployLambdaCode as jest.Mock).mockResolvedValueOnce(
    deployLambdaCodeResponse
  );

  await deployCloudFormation({
    lambdaEntryPoints,
    lambdaExternal,
    template: mockWorkingCloudFormationTemplate,
  });

  expect(deployLambdaCode).toHaveBeenCalledWith({
    lambdaImage: undefined,
    lambdaEntryPoints,
    lambdaExternal,
    stackName: mockStackName,
  });

  expect(deploy).toHaveBeenCalledWith({
    params: {
      Parameters: [
        {
          ParameterKey: 'LambdaS3Bucket',
          ParameterValue: deployLambdaCodeResponse.bucket,
        },
        {
          ParameterKey: 'LambdaS3Key',
          ParameterValue: deployLambdaCodeResponse.key,
        },
        {
          ParameterKey: 'LambdaS3ObjectVersion',
          ParameterValue: deployLambdaCodeResponse.versionId,
        },
      ],
      StackName: mockStackName,
    },
    template: {
      ...mockWorkingCloudFormationTemplate,
      Parameters: {
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
    },
  });
});

test('add Code properties to AWS::Lambda::Function resource', async () => {
  const deployLambdaCodeResponse = {
    bucket: faker.lorem.word(),
    key: faker.lorem.word(),
    versionId: faker.lorem.word(),
  };

  (deployLambdaCode as jest.Mock).mockResolvedValueOnce(
    deployLambdaCodeResponse
  );

  const handler = `${faker.lorem.word()}.handler`;

  const template = {
    ...mockWorkingCloudFormationTemplate,
    Resources: {
      LambdaFunction: {
        Type: 'AWS::Lambda::Function',
        Properties: {
          Handler: handler,
        },
      },
    },
  };

  await deployCloudFormation({
    lambdaEntryPoints: [],
    lambdaExternal,
    template,
  });

  expect(deploy).toHaveBeenCalledWith({
    params: {
      Parameters: [
        {
          ParameterKey: 'LambdaS3Bucket',
          ParameterValue: deployLambdaCodeResponse.bucket,
        },
        {
          ParameterKey: 'LambdaS3Key',
          ParameterValue: deployLambdaCodeResponse.key,
        },
        {
          ParameterKey: 'LambdaS3ObjectVersion',
          ParameterValue: deployLambdaCodeResponse.versionId,
        },
      ],
      StackName: mockStackName,
    },
    template: {
      ...mockWorkingCloudFormationTemplate,
      Parameters: {
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
        LambdaFunction: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            Code: {
              S3Bucket: {
                Ref: 'LambdaS3Bucket',
              },
              S3Key: {
                Ref: 'LambdaS3Key',
              },
              S3ObjectVersion: {
                Ref: 'LambdaS3ObjectVersion',
              },
            },
            Handler: handler,
          },
        },
      },
    },
  });
});

test('do not change existing Code properties on AWS::Lambda::Function resource', async () => {
  const deployLambdaCodeResponse = {
    bucket: faker.lorem.word(),
    key: faker.lorem.word(),
    versionId: faker.lorem.word(),
  };

  (deployLambdaCode as jest.Mock).mockResolvedValueOnce(
    deployLambdaCodeResponse
  );

  const template = {
    ...mockWorkingCloudFormationTemplate,
    Resources: {
      LambdaFunction: {
        Type: 'AWS::Lambda::Function',
        Properties: {
          Code: {
            S3Bucket: {
              Ref: 'OtherLambdaS3Bucket',
            },
            S3Key: {
              Ref: 'OtherLambdaS3Key',
            },
            S3ObjectVersion: {
              Ref: 'OtherLambdaS3ObjectVersion',
            },
          },
        },
      },
    },
  };

  await deployCloudFormation({
    lambdaEntryPoints,
    lambdaExternal,
    template,
  });

  expect(deploy).toHaveBeenCalledWith({
    params: {
      Parameters: [
        {
          ParameterKey: 'LambdaS3Bucket',
          ParameterValue: deployLambdaCodeResponse.bucket,
        },
        {
          ParameterKey: 'LambdaS3Key',
          ParameterValue: deployLambdaCodeResponse.key,
        },
        {
          ParameterKey: 'LambdaS3ObjectVersion',
          ParameterValue: deployLambdaCodeResponse.versionId,
        },
      ],
      StackName: mockStackName,
    },
    template: {
      ...mockWorkingCloudFormationTemplate,
      Parameters: {
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
        LambdaFunction: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            Code: {
              S3Bucket: {
                Ref: 'OtherLambdaS3Bucket',
              },
              S3Key: {
                Ref: 'OtherLambdaS3Key',
              },
              S3ObjectVersion: {
                Ref: 'OtherLambdaS3ObjectVersion',
              },
            },
          },
        },
      },
    },
  });
});

test('add CodeUri properties to AWS::Serverless::Function resource', async () => {
  const deployLambdaCodeResponse = {
    bucket: faker.lorem.word(),
    key: faker.lorem.word(),
    versionId: faker.lorem.word(),
  };

  (deployLambdaCode as jest.Mock).mockResolvedValueOnce(
    deployLambdaCodeResponse
  );

  const template = {
    ...mockWorkingCloudFormationTemplate,
    Resources: {
      ServerlessFunction: {
        Type: 'AWS::Serverless::Function',
        Properties: {},
      },
    },
  };

  await deployCloudFormation({
    lambdaEntryPoints,
    lambdaExternal,
    template,
  });

  expect(deploy).toHaveBeenCalledWith({
    params: {
      Parameters: [
        {
          ParameterKey: 'LambdaS3Bucket',
          ParameterValue: deployLambdaCodeResponse.bucket,
        },
        {
          ParameterKey: 'LambdaS3Key',
          ParameterValue: deployLambdaCodeResponse.key,
        },
        {
          ParameterKey: 'LambdaS3ObjectVersion',
          ParameterValue: deployLambdaCodeResponse.versionId,
        },
      ],
      StackName: mockStackName,
    },
    template: {
      ...mockWorkingCloudFormationTemplate,
      Parameters: {
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
        ServerlessFunction: {
          Type: 'AWS::Serverless::Function',
          Properties: {
            CodeUri: {
              Bucket: {
                Ref: 'LambdaS3Bucket',
              },
              Key: {
                Ref: 'LambdaS3Key',
              },
              Version: {
                Ref: 'LambdaS3ObjectVersion',
              },
            },
          },
        },
      },
    },
  });
});

test('do not change existing CodeUri properties on AWS::Serverless::Function resource', async () => {
  const deployLambdaCodeResponse = {
    bucket: faker.lorem.word(),
    key: faker.lorem.word(),
    versionId: faker.lorem.word(),
  };

  (deployLambdaCode as jest.Mock).mockResolvedValueOnce(
    deployLambdaCodeResponse
  );

  const template = {
    ...mockWorkingCloudFormationTemplate,
    Resources: {
      ServerlessFunction: {
        Type: 'AWS::Serverless::Function',
        Properties: {
          CodeUri: {
            Bucket: {
              Ref: 'OtherLambdaS3Bucket',
            },
            Key: {
              Ref: 'OtherLambdaS3Key',
            },
            Version: {
              Ref: 'OtherLambdaS3ObjectVersion',
            },
          },
        },
      },
    },
  };

  await deployCloudFormation({
    lambdaEntryPoints,
    lambdaExternal,
    template,
  });

  expect(deploy).toHaveBeenCalledWith({
    params: {
      Parameters: [
        {
          ParameterKey: 'LambdaS3Bucket',
          ParameterValue: deployLambdaCodeResponse.bucket,
        },
        {
          ParameterKey: 'LambdaS3Key',
          ParameterValue: deployLambdaCodeResponse.key,
        },
        {
          ParameterKey: 'LambdaS3ObjectVersion',
          ParameterValue: deployLambdaCodeResponse.versionId,
        },
      ],
      StackName: mockStackName,
    },
    template: {
      ...mockWorkingCloudFormationTemplate,
      Parameters: {
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
        ServerlessFunction: {
          Type: 'AWS::Serverless::Function',
          Properties: {
            CodeUri: {
              Bucket: {
                Ref: 'OtherLambdaS3Bucket',
              },
              Key: {
                Ref: 'OtherLambdaS3Key',
              },
              Version: {
                Ref: 'OtherLambdaS3ObjectVersion',
              },
            },
          },
        },
      },
    },
  });
});

test('adding Lambda image properties', async () => {
  const deployLambdaCodeResponse = {
    imageUri: faker.word.sample(),
  };

  (deployLambdaCode as jest.Mock).mockResolvedValueOnce(
    deployLambdaCodeResponse
  );

  await deployCloudFormation({
    lambdaImage: true,
    lambdaEntryPoints,
    lambdaExternal,
    template: mockWorkingCloudFormationTemplate,
  });

  expect(deployLambdaCode).toHaveBeenCalledWith({
    lambdaEntryPoints,
    lambdaExternal,
    lambdaImage: true,
    stackName: mockStackName,
  });

  expect(deploy).toHaveBeenCalledWith({
    params: {
      Parameters: [
        {
          ParameterKey: 'LambdaImageUri',
          ParameterValue: deployLambdaCodeResponse.imageUri,
        },
      ],
      StackName: mockStackName,
    },
    template: {
      ...mockWorkingCloudFormationTemplate,
      Parameters: {
        LambdaImageUri: {
          Type: 'String',
        },
      },
    },
  });
});

test('adding parameters to method', async () => {
  const parameters = [
    {
      key: 'WordKey',
      value: 'WordValue',
    },
    {
      key: 'NumberKey',
      value: 123,
    },
  ];

  await deployCloudFormation({
    lambdaEntryPoints,
    lambdaExternal,
    parameters,
    template: mockWorkingCloudFormationTemplate,
  });

  expect(deploy).toHaveBeenCalledWith({
    params: {
      Parameters: parameters.map((parameter) => {
        return {
          ParameterKey: parameter.key,
          ParameterValue: parameter.value,
        };
      }),
      StackName: mockStackName,
    },
    template: {
      ...mockWorkingCloudFormationTemplate,
      Parameters: {
        ...mockWorkingCloudFormationTemplate.Parameters,
        WordKey: {
          Type: 'String',
        },
        NumberKey: {
          Type: 'Number',
        },
      },
    },
  });
});

test('do not deploy lambda code if lambda-entry-points is empty', async () => {
  await deployCloudFormation({
    lambdaEntryPoints: [],
    lambdaExternal,
    template: mockWorkingCloudFormationTemplate,
  });

  expect(buildLambdaCode).not.toHaveBeenCalled();
});
