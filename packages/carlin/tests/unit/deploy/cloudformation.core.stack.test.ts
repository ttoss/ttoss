import {
  CloudFormationClient,
  CreateStackCommand,
  DeleteStackCommand,
  DescribeStackEventsCommand,
  DescribeStacksCommand,
  type StackStatus,
  UpdateStackCommand,
} from '@aws-sdk/client-cloudformation';
import { mockClient } from 'aws-sdk-client-mock';
import {
  createStack,
  deleteStack,
  updateStack,
} from 'src/deploy/cloudformation.core';

/**
 * The real AWS SDK v3 waiters run against the mocked client. Their first check
 * happens immediately, so returning a final stack status settles them without
 * waiting.
 */
const cloudFormationMock = mockClient(CloudFormationClient);

const stackName = 'my-stack';

const stackWithStatus = (status: StackStatus) => {
  return {
    Stacks: [
      { StackName: stackName, StackStatus: status, CreationTime: new Date() },
    ],
  };
};

beforeEach(() => {
  cloudFormationMock.reset();
  cloudFormationMock.on(DescribeStackEventsCommand).resolves({
    StackEvents: [],
  });
});

describe('createStack', () => {
  test('should create the stack and wait for its creation', async () => {
    cloudFormationMock.on(CreateStackCommand).resolves({});
    cloudFormationMock
      .on(DescribeStacksCommand)
      .resolves(stackWithStatus('CREATE_COMPLETE'));

    await createStack({ params: { StackName: stackName } });

    expect(
      cloudFormationMock.commandCalls(CreateStackCommand)[0].args[0].input
    ).toEqual({ StackName: stackName });
    expect(
      cloudFormationMock.commandCalls(DescribeStacksCommand)[0].args[0].input
    ).toEqual({ StackName: stackName });
  });

  test('should delete the stack and throw if the creation fails', async () => {
    cloudFormationMock.on(CreateStackCommand).resolves({});
    cloudFormationMock
      .on(DescribeStacksCommand)
      .resolvesOnce(stackWithStatus('ROLLBACK_COMPLETE'))
      .resolves(stackWithStatus('DELETE_COMPLETE'));
    cloudFormationMock.on(DeleteStackCommand).resolves({});

    await expect(
      createStack({ params: { StackName: stackName } })
    ).rejects.toThrow();

    expect(
      cloudFormationMock.commandCalls(DescribeStackEventsCommand)
    ).toHaveLength(1);
    expect(cloudFormationMock.commandCalls(DeleteStackCommand)).toHaveLength(1);
  });
});

describe('updateStack', () => {
  test('should update the stack and wait for its update', async () => {
    cloudFormationMock.on(UpdateStackCommand).resolves({});
    cloudFormationMock
      .on(DescribeStacksCommand)
      .resolves(stackWithStatus('UPDATE_COMPLETE'));

    await updateStack({ params: { StackName: stackName } });

    expect(cloudFormationMock.commandCalls(UpdateStackCommand)).toHaveLength(1);
    expect(cloudFormationMock.commandCalls(DescribeStacksCommand)).toHaveLength(
      1
    );
  });

  test('should notice an update that finishes within seconds', async () => {
    jest.useFakeTimers();
    try {
      cloudFormationMock.on(UpdateStackCommand).resolves({});
      cloudFormationMock
        .on(DescribeStacksCommand)
        .resolvesOnce(stackWithStatus('UPDATE_IN_PROGRESS'))
        .resolves(stackWithStatus('UPDATE_COMPLETE'));

      let settled = false;
      const update = updateStack({ params: { StackName: stackName } }).then(
        () => {
          settled = true;
        }
      );

      await jest.advanceTimersByTimeAsync(5_000);

      expect(settled).toBe(true);
      expect(
        cloudFormationMock.commandCalls(DescribeStacksCommand)
      ).toHaveLength(2);
      await update;
    } finally {
      jest.useRealTimers();
    }
  });

  test('should not throw when there are no updates', async () => {
    cloudFormationMock
      .on(UpdateStackCommand)
      .rejects(new Error('No updates are to be performed.'));

    await expect(
      updateStack({ params: { StackName: stackName } })
    ).resolves.toBeUndefined();

    expect(cloudFormationMock.commandCalls(DescribeStacksCommand)).toHaveLength(
      0
    );
  });

  test('should describe events and throw if the update fails', async () => {
    cloudFormationMock.on(UpdateStackCommand).resolves({});
    cloudFormationMock
      .on(DescribeStacksCommand)
      .resolves(stackWithStatus('UPDATE_ROLLBACK_COMPLETE'));

    await expect(
      updateStack({ params: { StackName: stackName } })
    ).rejects.toThrow();

    expect(
      cloudFormationMock.commandCalls(DescribeStackEventsCommand)
    ).toHaveLength(1);
  });
});

describe('deleteStack', () => {
  test('should delete the stack and wait for its deletion', async () => {
    cloudFormationMock.on(DeleteStackCommand).resolves({});
    cloudFormationMock
      .on(DescribeStacksCommand)
      .resolves(stackWithStatus('DELETE_COMPLETE'));

    await deleteStack({ stackName });

    expect(
      cloudFormationMock.commandCalls(DeleteStackCommand)[0].args[0].input
    ).toEqual({ StackName: stackName });
  });

  test('should describe events and throw if the deletion fails', async () => {
    cloudFormationMock.on(DeleteStackCommand).resolves({});
    cloudFormationMock
      .on(DescribeStacksCommand)
      .resolves(stackWithStatus('DELETE_FAILED'));

    await expect(deleteStack({ stackName })).rejects.toThrow();

    expect(
      cloudFormationMock.commandCalls(DescribeStackEventsCommand)
    ).toHaveLength(1);
  });
});
