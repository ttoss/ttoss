import {
  CreateStackCommand,
  DeleteStackCommand,
  DescribeStacksCommand,
  type DescribeStacksOutput,
  UpdateStackCommand,
} from '@aws-sdk/client-cloudformation';
import {
  createStack,
  deleteStack,
  deploy,
  updateStack,
} from 'src/deploy/cloudformation.core';
import { getRoleArnParam, setRoleArn } from 'src/deploy/roleArn';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-cloudformation', () => {
  return {
    ...jest.requireActual('@aws-sdk/client-cloudformation'),
    CloudFormationClient: jest.fn(() => {
      return { send: mockSend };
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

jest.mock('fs', () => {
  return {
    ...jest.requireActual('fs'),
    promises: {
      ...jest.requireActual('fs').promises,
      mkdir: jest.fn(),
      writeFile: jest.fn().mockResolvedValue(undefined),
    },
  };
});

/**
 * Inputs of every command of the given class sent to CloudFormation.
 */
const sentInputs = (
  command:
    | typeof CreateStackCommand
    | typeof UpdateStackCommand
    | typeof DeleteStackCommand
) => {
  return mockSend.mock.calls
    .map(([sent]) => {
      return sent;
    })
    .filter((sent) => {
      return sent instanceof command;
    })
    .map((sent) => {
      return sent.input;
    });
};

const existingStack: DescribeStacksOutput = {
  Stacks: [
    {
      StackName: 'RoleArnStack',
      StackStatus: 'CREATE_COMPLETE',
      CreationTime: new Date(),
      Outputs: [],
    },
  ],
};

/**
 * DescribeStacks answers as if the stack exists, or as CloudFormation answers
 * for a missing stack until it is created.
 */
const mockStackExists = (exists: boolean) => {
  let created = exists;
  mockSend.mockImplementation((sent) => {
    if (sent instanceof DescribeStacksCommand) {
      return created
        ? Promise.resolve(existingStack)
        : Promise.reject({ Code: 'ValidationError' });
    }
    if (sent instanceof CreateStackCommand) {
      created = true;
    }
    return Promise.resolve({});
  });
};

const roleArn = 'arn:aws:iam::123456789012:role/CloudFormationExecutionRole';

const stackName = 'RoleArnStack';

const template = {
  AWSTemplateFormatVersion: '2010-09-09' as const,
  Resources: {
    Topic: { Type: 'AWS::SNS::Topic' },
  },
};

beforeEach(() => {
  mockSend.mockReset();
  mockSend.mockResolvedValue({});
  setRoleArn(undefined);
});

afterAll(() => {
  setRoleArn(undefined);
});

describe('getRoleArnParam', () => {
  test('should be empty when --role-arn is not set', () => {
    expect(getRoleArnParam()).toEqual({});
  });

  test('should carry RoleARN when --role-arn is set', () => {
    setRoleArn(roleArn);
    expect(getRoleArnParam()).toEqual({ RoleARN: roleArn });
  });
});

describe.each([
  {
    name: 'CreateStack',
    command: CreateStackCommand,
    run: () => {
      return createStack({ params: { StackName: stackName } });
    },
  },
  {
    name: 'UpdateStack',
    command: UpdateStackCommand,
    run: () => {
      return updateStack({ params: { StackName: stackName } });
    },
  },
  {
    name: 'DeleteStack',
    command: DeleteStackCommand,
    run: () => {
      return deleteStack({ stackName });
    },
  },
])('$name', ({ command, run }) => {
  test('should send RoleARN when --role-arn is set', async () => {
    setRoleArn(roleArn);

    await run();

    expect(sentInputs(command)).toEqual([
      { StackName: stackName, RoleARN: roleArn },
    ]);
  });

  test('should not send a RoleARN key when --role-arn is not set', async () => {
    await run();

    const [input] = sentInputs(command);
    expect(input).toEqual({ StackName: stackName });
    expect(input).not.toHaveProperty('RoleARN');
  });
});

describe('deploy', () => {
  test('should create a new stack with the service role', async () => {
    setRoleArn(roleArn);

    mockStackExists(false);

    await deploy({ params: { StackName: stackName }, template });

    expect(sentInputs(CreateStackCommand)).toEqual([
      expect.objectContaining({ StackName: stackName, RoleARN: roleArn }),
    ]);
    expect(sentInputs(UpdateStackCommand)).toEqual([]);
  });

  test('should update an existing stack with the service role', async () => {
    setRoleArn(roleArn);

    mockStackExists(true);

    await deploy({ params: { StackName: stackName }, template });

    expect(sentInputs(UpdateStackCommand)).toEqual([
      expect.objectContaining({ StackName: stackName, RoleARN: roleArn }),
    ]);
    expect(sentInputs(CreateStackCommand)).toEqual([]);
  });
});
