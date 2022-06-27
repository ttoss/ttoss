import {
  DescribeStacksCommand,
  DescribeStacksOutput,
} from '@aws-sdk/client-cloudformation';
import { faker } from '@ttoss/test-utils/faker';

const MockDescribeStacksCommand = DescribeStacksCommand;

// : CloudFormation.DescribeStacksOutput
const mockDescribeStacksOutput = {
  Stacks: [
    {
      StackName: faker.random.word(),
      CreationTime: faker.date.past(3),
      StackStatus: 'OK',
      Outputs: [
        {
          OutputKey: faker.random.word(),
          OutputValue: faker.random.word(),
        },
        {
          OutputKey: faker.random.word(),
          OutputValue: faker.random.word(),
        },
      ],
    },
    {
      StackName: faker.random.word(),
      CreationTime: faker.date.past(3),
      StackStatus: 'OK',
      Outputs: [],
    },
  ],
};

jest.mock('@aws-sdk/client-cloudformation', () => ({
  ...(jest.requireActual('@aws-sdk/client-cloudformation') as any),
  CloudFormationClient: jest.fn(() => ({
    send: jest.fn((input: any) => {
      if (input instanceof MockDescribeStacksCommand) {
        const {
          input: { StackName },
        } = input;

        return new Promise<DescribeStacksOutput>((resolve, reject) => {
          if (!StackName) {
            resolve(mockDescribeStacksOutput);
          } else {
            const stacks = (mockDescribeStacksOutput.Stacks || []).filter(
              (stack) => stack.StackName === StackName
            );

            if (stacks.length > 0) {
              resolve({
                Stacks: (mockDescribeStacksOutput.Stacks || []).filter(
                  (stack) => stack.StackName === StackName
                ),
              });
            } else {
              // eslint-disable-next-line prefer-promise-reject-errors
              reject({
                Code: 'ValidationError',
              });
            }
          }
        });
      }

      return null;
    }),
  })),
}));

import {
  describeStack,
  describeStacks,
  doesStackExist,
  getStackOutput,
} from './cloudFormation.core';

describe('doesStackExist method', () => {
  test.each(mockDescribeStacksOutput.Stacks.map((stack) => stack.StackName))(
    'should return true if stack exists: %s',
    (stackName) => {
      return expect(doesStackExist({ stackName })).resolves.toEqual(true);
    }
  );

  test("should return false when stack doesn't exist", () => {
    const stackName = mockDescribeStacksOutput.Stacks.map(
      (stack) => stack.StackName
    ).join('-');

    return expect(doesStackExist({ stackName })).resolves.toEqual(false);
  });
});

describe('stack methods', () => {
  test('describeStacks should return all stacks', async () => {
    const stacks = await describeStacks();
    expect(stacks).toEqual(mockDescribeStacksOutput.Stacks);
  });

  test.each(mockDescribeStacksOutput.Stacks.map((stack) => stack))(
    'describeStack should return only one stack %#',
    async (outputStack) => {
      const stack = await describeStack({
        stackName: outputStack.StackName,
      });
      expect(stack).toEqual(outputStack);
    }
  );

  test('getStackOutput should return the output', async () => {
    const output = await getStackOutput({
      stackName: mockDescribeStacksOutput.Stacks[0].StackName,
      outputKey: mockDescribeStacksOutput.Stacks[0].Outputs[0].OutputKey,
    });
    expect(output).toEqual(mockDescribeStacksOutput.Stacks[0].Outputs[0]);
  });
});
