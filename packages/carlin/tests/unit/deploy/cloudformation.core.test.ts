import type { DescribeStacksOutput } from '@aws-sdk/client-cloudformation';
import { DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
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
  exportEnvVars,
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
      appendFile: jest.fn().mockResolvedValue(undefined),
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

  test('should call exportEnvVars when envExport is provided', async () => {
    const stackName = mockDescribeStacksOutput.Stacks[0].StackName;
    const [firstOutput, secondOutput] =
      mockDescribeStacksOutput.Stacks[0].Outputs;

    const envExport = {
      [firstOutput.OutputKey]: 'FIRST_VAR',
      [secondOutput.OutputKey]: 'SECOND_VAR',
    };

    const appendFileMock = jest
      .spyOn(fs.promises, 'appendFile')
      .mockResolvedValue(undefined);

    const originalGithubEnv = process.env.GITHUB_ENV;
    process.env.GITHUB_ENV = '/tmp/github_env_test';

    try {
      await printStackOutputsAfterDeploy({ stackName, envExport });

      expect(appendFileMock).toHaveBeenCalledTimes(2);
      expect(appendFileMock).toHaveBeenCalledWith(
        '/tmp/github_env_test',
        `FIRST_VAR=${firstOutput.OutputValue}\n`
      );
      expect(appendFileMock).toHaveBeenCalledWith(
        '/tmp/github_env_test',
        `SECOND_VAR=${secondOutput.OutputValue}\n`
      );
    } finally {
      process.env.GITHUB_ENV = originalGithubEnv;
    }
  });
});

describe('exportEnvVars', () => {
  const outputs = mockDescribeStacksOutput.Stacks[0].Outputs.map((o) => {
    return { OutputKey: o.OutputKey, OutputValue: o.OutputValue };
  });

  const [firstOutput, secondOutput] = outputs;

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.GITHUB_ENV;
  });

  test('should append KEY=VALUE lines to GITHUB_ENV when GITHUB_ENV is set', async () => {
    process.env.GITHUB_ENV = '/tmp/github_env_test';

    const appendFileMock = jest
      .spyOn(fs.promises, 'appendFile')
      .mockResolvedValue(undefined);

    await exportEnvVars({
      outputs,
      envExport: {
        [firstOutput.OutputKey]: 'MY_FIRST_VAR',
        [secondOutput.OutputKey]: 'MY_SECOND_VAR',
      },
    });

    expect(appendFileMock).toHaveBeenCalledTimes(2);
    expect(appendFileMock).toHaveBeenCalledWith(
      '/tmp/github_env_test',
      `MY_FIRST_VAR=${firstOutput.OutputValue}\n`
    );
    expect(appendFileMock).toHaveBeenCalledWith(
      '/tmp/github_env_test',
      `MY_SECOND_VAR=${secondOutput.OutputValue}\n`
    );
  });

  test('should print export statements to stdout when GITHUB_ENV is not set', async () => {
    delete process.env.GITHUB_ENV;

    const stdoutWriteMock = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => {
        return true;
      });

    await exportEnvVars({
      outputs,
      envExport: {
        [firstOutput.OutputKey]: 'MY_FIRST_VAR',
        [secondOutput.OutputKey]: 'MY_SECOND_VAR',
      },
    });

    expect(stdoutWriteMock).toHaveBeenCalledTimes(2);
    expect(stdoutWriteMock).toHaveBeenCalledWith(
      `export MY_FIRST_VAR='${firstOutput.OutputValue}'\n`
    );
    expect(stdoutWriteMock).toHaveBeenCalledWith(
      `export MY_SECOND_VAR='${secondOutput.OutputValue}'\n`
    );
  });

  test('should warn and skip when a CloudFormation output key is not found', async () => {
    delete process.env.GITHUB_ENV;

    const stdoutWriteMock = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => {
        return true;
      });

    await exportEnvVars({
      outputs,
      envExport: {
        NonExistentKey: 'MISSING_VAR',
        [firstOutput.OutputKey]: 'FOUND_VAR',
      },
    });

    expect(stdoutWriteMock).toHaveBeenCalledTimes(1);
    expect(stdoutWriteMock).toHaveBeenCalledWith(
      `export FOUND_VAR='${firstOutput.OutputValue}'\n`
    );
  });
  test('should escape single quotes in values for generic shell output', async () => {
    delete process.env.GITHUB_ENV;

    const outputsWithQuote = [
      { OutputKey: 'MyKey', OutputValue: "it's a value" },
    ];

    const stdoutWriteMock = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => {
        return true;
      });

    await exportEnvVars({
      outputs: outputsWithQuote,
      envExport: { MyKey: 'MY_VAR' },
    });

    expect(stdoutWriteMock).toHaveBeenCalledWith(
      `export MY_VAR='it'\\''s a value'\n`
    );
  });

  test('should warn and skip when value contains newlines in GitHub Actions', async () => {
    process.env.GITHUB_ENV = '/tmp/github_env_test';

    const outputsWithNewline = [
      { OutputKey: 'MultilineKey', OutputValue: 'line1\nline2' },
    ];

    const appendFileMock = jest
      .spyOn(fs.promises, 'appendFile')
      .mockResolvedValue(undefined);

    await exportEnvVars({
      outputs: outputsWithNewline,
      envExport: { MultilineKey: 'MY_MULTILINE_VAR' },
    });

    expect(appendFileMock).not.toHaveBeenCalled();
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
