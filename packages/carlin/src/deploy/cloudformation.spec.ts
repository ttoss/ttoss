/* eslint-disable no-var */
import { CloudFormationTemplate } from '../utils/cloudFormationTemplate';
import { deploy } from './cloudFormation.core';
import { deployLambdaCode } from './lambda/deployLambdaCode';
import { faker } from '@ttoss/test-utils/faker';
import { getStackName } from './stackName';

const mockWorkingCloudFormationTemplate: CloudFormationTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Resources: {
    SomeResource: {
      Type: faker.random.word(),
      Properties: {},
    },
  },
};

jest.mock('./cloudFormation.core', () => {
  return {
    deploy: jest.fn(),
    cloudFormationV2: jest.fn().mockReturnValue({
      validateTemplate: jest.fn(({ TemplateBody }: any) => {
        return {
          promise: () => {
            if (
              TemplateBody ===
              JSON.stringify(mockWorkingCloudFormationTemplate, null, 2)
            ) {
              return Promise.resolve();
            }

            return Promise.reject();
          },
        };
      }),
    }),
  };
});

jest.mock('./lambda/deployLambdaCode', () => {
  return {
    deployLambdaCode: jest.fn(),
  };
});

jest.mock('./stackName', () => {
  return {
    getStackName: jest.fn(),
  };
});

import { defaultTemplatePaths, deployCloudFormation } from './cloudFormation';

const mockStackName = faker.random.word();

beforeAll(() => {
  (getStackName as jest.Mock).mockReturnValue(mockStackName);
});

test('all templates paths should start with .src', () => {
  defaultTemplatePaths.forEach((path) => {
    expect(path.startsWith('./src/cloudformation.')).toBeTruthy();
  });
});

describe('testing deployCloudFormation method', () => {
  const lambdaInput = faker.random.word();

  const lambdaExternals = [...new Array(5)].map(() => {
    return faker.random.word();
  });

  test('return working cloudformation template if passed via template', async () => {
    (deployLambdaCode as jest.Mock).mockResolvedValueOnce(undefined);

    await deployCloudFormation({
      lambdaInput,
      template: mockWorkingCloudFormationTemplate,
    });

    expect(deploy).toHaveBeenCalledWith({
      params: {
        Parameters: [],
        StackName: mockStackName,
      },
      template: mockWorkingCloudFormationTemplate,
    });
  });

  test('adding Lambda S3 properties', async () => {
    const deployLambdaCodeResponse = {
      bucket: faker.random.word(),
      key: faker.random.word(),
      versionId: faker.random.word(),
    };

    (deployLambdaCode as jest.Mock).mockResolvedValueOnce(
      deployLambdaCodeResponse
    );

    await deployCloudFormation({
      lambdaInput,
      lambdaExternals,
      template: mockWorkingCloudFormationTemplate,
    });

    expect(deployLambdaCode).toHaveBeenCalledWith({
      lambdaExternals,
      lambdaImage: undefined,
      lambdaInput,
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

  test('adding Lambda image properties', async () => {
    const deployLambdaCodeResponse = {
      imageUri: faker.random.word(),
    };

    (deployLambdaCode as jest.Mock).mockResolvedValueOnce(
      deployLambdaCodeResponse
    );

    await deployCloudFormation({
      lambdaImage: true,
      lambdaInput,
      lambdaExternals,
      template: mockWorkingCloudFormationTemplate,
    });

    expect(deployLambdaCode).toHaveBeenCalledWith({
      lambdaExternals,
      lambdaImage: true,
      lambdaInput,
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
});
