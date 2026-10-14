import { DescribeStackResourceCommand } from '@aws-sdk/client-cloudformation';

import { getStaticAppBucket } from './getStaticAppBucket';

const mockWorkingStackName = 'mockWorkingStackName';

const mockWorkingStackBucketName = 'mockWorkingStackBucketName';

const mockWorkingStackNameWithoutPhysicalResourceId =
  'mockWorkingStackNameWithoutPhysicalResourceId';

const notWorkingStackName = [
  mockWorkingStackName,
  mockWorkingStackNameWithoutPhysicalResourceId,
].join('-');

const MockDescribeStackResourceCommand = DescribeStackResourceCommand;

jest.mock('@aws-sdk/client-cloudformation', () => {
  return {
    ...jest.requireActual<object>('@aws-sdk/client-cloudformation'),
    CloudFormationClient: jest.fn(() => {
      return {
        send: jest.fn((input: unknown) => {
          if (input instanceof MockDescribeStackResourceCommand) {
            const {
              input: { StackName },
            } = input;

            return new Promise((resolve, reject) => {
              if (StackName === mockWorkingStackName) {
                resolve({
                  StackResourceDetail: {
                    PhysicalResourceId: mockWorkingStackBucketName,
                  },
                });
              } else if (
                StackName === mockWorkingStackNameWithoutPhysicalResourceId
              ) {
                resolve({ StackResourceDetail: {} });
              } else {
                reject();
              }
            });
          }

          return null;
        }),
      };
    }),
  };
});

test('should return the bucket name', async () => {
  return expect(
    getStaticAppBucket({
      stackName: mockWorkingStackName,
    })
  ).resolves.toEqual(mockWorkingStackBucketName);
});

test("should return undefined because PhysicalResourceId doesn't exist", async () => {
  return expect(
    getStaticAppBucket({
      stackName: mockWorkingStackNameWithoutPhysicalResourceId,
    })
  ).resolves.toBeUndefined();
});

test("should return undefined because stack doesn't exist", async () => {
  return expect(
    getStaticAppBucket({
      stackName: notWorkingStackName,
    })
  ).resolves.toBeUndefined();
});
