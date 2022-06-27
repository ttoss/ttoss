import { DescribeStackResourceCommand } from '@aws-sdk/client-cloudformation';
import { faker } from '@ttoss/test-utils/faker';

const mockWorkingStackName = faker.random.word();

const mockWorkingStackBucketName = faker.random.word();

const mockWorkingStackNameWithoutPhysicalResourceId = faker.random.word();

const notWorkingStackName = [
  mockWorkingStackName,
  mockWorkingStackNameWithoutPhysicalResourceId,
].join('-');

const MockDescribeStackResourceCommand = DescribeStackResourceCommand;

jest.mock('@aws-sdk/client-cloudformation', () => ({
  ...(jest.requireActual('@aws-sdk/client-cloudformation') as any),
  CloudFormationClient: jest.fn(() => ({
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
  })),
}));

import { getStaticAppBucket } from './getStaticAppBucket';

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
