import {
  DescribeStacksCommand,
  DescribeStacksOutput,
} from '@aws-sdk/client-cloudformation';
import { faker } from '@ttoss/test-utils/faker';

const MockDescribeStacksCommand = DescribeStacksCommand;

const mockDescribeStacksOutput = {
  Stacks: [
    {
      StackName: faker.lorem.word(),
      CreationTime: faker.date.past(),
      StackStatus: 'CREATE_COMPLETE',
      Outputs: [
        {
          OutputKey: 'k0' + faker.lorem.word(),
          OutputValue: 'v0' + faker.lorem.word(),
        },
        {
          OutputKey: 'k1' + faker.lorem.word(),
          OutputValue: 'v1' + faker.lorem.word(),
        },
      ],
    },
    {
      StackName: faker.lorem.word(),
      CreationTime: faker.date.past(),
      StackStatus: 'CREATE_COMPLETE',
      Outputs: [],
    },
  ],
};

jest.mock('@aws-sdk/client-cloudformation', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(jest.requireActual('@aws-sdk/client-cloudformation') as any),
    CloudFormationClient: jest.fn(() => {
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        send: jest.fn((input: any) => {
          if (input instanceof MockDescribeStacksCommand) {
            const {
              input: { StackName },
            } = input;

            return new Promise<DescribeStacksOutput>((resolve, reject) => {
              if (!StackName) {
                resolve(mockDescribeStacksOutput as DescribeStacksOutput);
              } else {
                const stacks = (mockDescribeStacksOutput.Stacks || []).filter(
                  (stack) => {
                    return stack.StackName === StackName;
                  }
                );

                if (stacks.length > 0) {
                  resolve({
                    Stacks: (mockDescribeStacksOutput.Stacks || []).filter(
                      (stack) => {
                        return stack.StackName === StackName;
                      }
                    ) as DescribeStacksOutput['Stacks'],
                  });
                } else {
                  reject({
                    Code: 'ValidationError',
                  });
                }
              }
            });
          }

          return null;
        }),
      };
    }),
  };
});

import * as fs from 'node:fs';

import {
  describeStack,
  describeStacks,
  doesStackExist,
  getStackOutput,
  printStackOutputsAfterDeploy,
} from 'src/deploy/cloudformation.core';

jest.mock('fs', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(jest.requireActual('fs') as any),
    promises: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(jest.requireActual('fs').promises as any),
      mkdir: jest.fn(),
      writeFile: jest.fn().mockResolvedValue(undefined),
    },
  };
});

describe('printStackOutputsAfterDeploy', () => {
  test('should save the outputs using fs.promises.writeFile', async () => {
    const stackName = mockDescribeStacksOutput.Stacks[0].StackName;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let writeFileData: any;

    jest.spyOn(fs.promises, 'writeFile').mockImplementation((_, data) => {
      writeFileData = data;
      return Promise.resolve();
    });

    await printStackOutputsAfterDeploy({
      stackName: mockDescribeStacksOutput.Stacks[0].StackName,
    });

    expect(JSON.parse(writeFileData)).toEqual({
      stackName,
      packageName: '',
      projectName: '',
      outputs: {
        [mockDescribeStacksOutput.Stacks[0].Outputs[0].OutputKey]:
          mockDescribeStacksOutput.Stacks[0].Outputs[0],
        [mockDescribeStacksOutput.Stacks[0].Outputs[1].OutputKey]:
          mockDescribeStacksOutput.Stacks[0].Outputs[1],
      },
    });
  });
});

describe('doesStackExist method', () => {
  test.each(
    mockDescribeStacksOutput.Stacks.map((stack) => {
      return stack.StackName;
    })
  )('should return true if stack exists: %s', (stackName) => {
    return expect(doesStackExist({ stackName })).resolves.toEqual(true);
  });

  test("should return false when stack doesn't exist", () => {
    const stackName = mockDescribeStacksOutput.Stacks.map((stack) => {
      return stack.StackName;
    }).join('-');

    return expect(doesStackExist({ stackName })).resolves.toEqual(false);
  });
});

describe('stack methods', () => {
  test('describeStacks should return all stacks', async () => {
    const stacks = await describeStacks();
    expect(stacks).toEqual(mockDescribeStacksOutput.Stacks);
  });

  test.each(
    mockDescribeStacksOutput.Stacks.map((stack) => {
      return stack;
    })
  )('describeStack should return only one stack %#', async (outputStack) => {
    const stack = await describeStack({
      stackName: outputStack.StackName,
    });
    expect(stack).toEqual(outputStack);
  });

  test('getStackOutput should return the output', async () => {
    const output = await getStackOutput({
      stackName: mockDescribeStacksOutput.Stacks[0].StackName,
      outputKey: mockDescribeStacksOutput.Stacks[0].Outputs[0].OutputKey,
    });
    expect(output).toEqual(mockDescribeStacksOutput.Stacks[0].Outputs[0]);
  });
});
