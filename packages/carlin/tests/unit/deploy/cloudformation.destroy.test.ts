import {
  DeleteStackCommand,
  DescribeStacksCommand,
  type DescribeStacksOutput,
  ListStackResourcesCommand,
  type StackStatus,
} from '@aws-sdk/client-cloudformation';
import { destroy } from 'src/deploy/cloudformation.core';
import { emptyS3Directory } from 'src/deploy/s3';

const MockDeleteStackCommand = DeleteStackCommand;
const MockDescribeStacksCommand = DescribeStacksCommand;
const MockListStackResourcesCommand = ListStackResourcesCommand;

const mockStackName = 'mock-stack-name';
const mockBucketName = 'mock-bucket-name';

/**
 * The stack is deleted once DeleteStackCommand is sent, which ends the
 * `waitUntilStackDeleteComplete` polling on its first check.
 */
let mockStackStatus: StackStatus = 'CREATE_COMPLETE';

const mockDeleteStack = jest.fn(() => {
  mockStackStatus = 'DELETE_COMPLETE';
  return Promise.resolve({});
});
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
                  StackStatus: mockStackStatus,
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

jest.mock('src/deploy/s3', () => {
  return {
    ...jest.requireActual('src/deploy/s3'),
    emptyS3Directory: jest.fn(),
  };
});

describe('destroy', () => {
  beforeEach(() => {
    jest.mocked(emptyS3Directory).mockReset();
    mockDeleteStack.mockClear();
    mockStackStatus = 'CREATE_COMPLETE';
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
