import {
  DeleteStackCommand,
  DescribeStacksCommand,
  type DescribeStacksOutput,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';

const MockDeleteStackCommand = DeleteStackCommand;
const MockDescribeStacksCommand = DescribeStacksCommand;
const MockListStackResourcesCommand = ListStackResourcesCommand;

const mockStackName = 'mock-stack-name';
const mockBucketName = 'mock-bucket-name';

const mockDeleteStack = jest.fn().mockResolvedValue({});
const mockListStackResources = jest.fn().mockResolvedValue({
  StackResourceSummaries: [
    {
      ResourceType: 'AWS::S3::Bucket',
      PhysicalResourceId: mockBucketName,
    },
  ],
});

jest.mock('@aws-sdk/client-cloudformation', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(jest.requireActual('@aws-sdk/client-cloudformation') as any),
    CloudFormationClient: jest.fn(() => {
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        send: jest.fn((input: any) => {
          if (input instanceof MockDescribeStacksCommand) {
            return Promise.resolve<DescribeStacksOutput>({
              Stacks: [
                {
                  StackName: mockStackName,
                  CreationTime: new Date(),
                  StackStatus: 'CREATE_COMPLETE',
                  EnableTerminationProtection: false,
                },
              ],
            });
          }

          if (input instanceof MockListStackResourcesCommand) {
            return mockListStackResources();
          }

          if (input instanceof MockDeleteStackCommand) {
            return mockDeleteStack();
          }

          return null;
        }),
      };
    }),
  };
});

jest.mock('aws-sdk', () => {
  return {
    CloudFormation: jest.fn(() => {
      return {
        waitFor: jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue({}),
        }),
      };
    }),
  };
});

import { emptyS3Directory } from 'src/deploy/s3';

jest.mock('src/deploy/s3', () => {
  return {
    ...jest.requireActual('src/deploy/s3'),
    emptyS3Directory: jest.fn(),
  };
});

import { destroy } from 'src/deploy/cloudformation.core';

describe('destroy', () => {
  beforeEach(() => {
    jest.mocked(emptyS3Directory).mockReset();
    mockDeleteStack.mockClear();
  });

  test('should proceed with stack deletion even when emptying a bucket fails', async () => {
    jest
      .mocked(emptyS3Directory)
      .mockRejectedValueOnce(new Error('The specified bucket does not exist'));

    await destroy({ stackName: mockStackName });

    expect(mockDeleteStack).toHaveBeenCalledTimes(1);
  });

  test('should empty buckets and delete stack when everything succeeds', async () => {
    jest.mocked(emptyS3Directory).mockResolvedValueOnce(undefined);

    await destroy({ stackName: mockStackName });

    expect(emptyS3Directory).toHaveBeenCalledWith({ bucket: mockBucketName });
    expect(mockDeleteStack).toHaveBeenCalledTimes(1);
  });
});
