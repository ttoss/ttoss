import {
  CodePipelineClient,
  GetPipelineStateCommand,
  PutApprovalResultCommand,
} from '@aws-sdk/client-codepipeline';
import { mockClient } from 'aws-sdk-client-mock';
import {
  PIPELINE_ECS_TASK_EXECUTION_MANUAL_APPROVAL_ACTION_NAME,
  PIPELINE_ECS_TASK_EXECUTION_STAGE_NAME,
} from 'src/deploy/cicd/config';
import { putApprovalResultManualTask } from 'src/deploy/cicd/lambdas/putApprovalResultManualTask';

const codePipelineMock = mockClient(CodePipelineClient);

const pipelineName = 'my-pipeline';

const result = { status: 'Approved', summary: 'ok' } as const;

const getPipelineState = ({
  status,
  token,
}: {
  status: 'InProgress' | 'Succeeded';
  token: string;
}) => {
  return {
    stageStates: [
      { stageName: 'Other' },
      {
        stageName: PIPELINE_ECS_TASK_EXECUTION_STAGE_NAME,
        actionStates: [
          {
            actionName: PIPELINE_ECS_TASK_EXECUTION_MANUAL_APPROVAL_ACTION_NAME,
            latestExecution: { status, token },
          },
        ],
      },
    ],
  };
};

/**
 * The pipeline state is read every five seconds.
 */
const runPolls = async (count: number) => {
  for (let i = 0; i < count; i++) {
    await jest.advanceTimersByTimeAsync(5 * 1000);
  }
};

beforeEach(() => {
  codePipelineMock.reset();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('should wait for the approval in progress and put its result', async () => {
  codePipelineMock
    .on(GetPipelineStateCommand)
    .resolvesOnce(getPipelineState({ status: 'Succeeded', token: 'old' }))
    .resolves(getPipelineState({ status: 'InProgress', token: 'token' }));
  codePipelineMock.on(PutApprovalResultCommand).resolves({});

  const promise = putApprovalResultManualTask({ pipelineName, result });

  await runPolls(2);
  await promise;

  expect(codePipelineMock.commandCalls(GetPipelineStateCommand)).toHaveLength(
    2
  );
  expect(
    codePipelineMock.commandCalls(GetPipelineStateCommand)[0].args[0].input
  ).toEqual({ name: pipelineName });
  expect(
    codePipelineMock.commandCalls(PutApprovalResultCommand)[0].args[0].input
  ).toEqual({
    pipelineName,
    stageName: PIPELINE_ECS_TASK_EXECUTION_STAGE_NAME,
    actionName: PIPELINE_ECS_TASK_EXECUTION_MANUAL_APPROVAL_ACTION_NAME,
    result,
    token: 'token',
  });
});

test('should reject when the approval stage does not exist', async () => {
  codePipelineMock.on(GetPipelineStateCommand).resolves({ stageStates: [] });

  const assertion = expect(
    putApprovalResultManualTask({ pipelineName, result })
  ).rejects.toThrow('ApprovalStageStateIsUndefined');

  await runPolls(1);
  await assertion;

  expect(codePipelineMock.commandCalls(PutApprovalResultCommand)).toHaveLength(
    0
  );
});

test('should reject when the approval action does not exist', async () => {
  codePipelineMock.on(GetPipelineStateCommand).resolves({
    stageStates: [
      { stageName: PIPELINE_ECS_TASK_EXECUTION_STAGE_NAME, actionStates: [] },
    ],
  });

  const assertion = expect(
    putApprovalResultManualTask({ pipelineName, result })
  ).rejects.toThrow('ApprovalActionStateIsUndefined');

  await runPolls(1);
  await assertion;
});

test('should reject when reading the pipeline state fails', async () => {
  codePipelineMock
    .on(GetPipelineStateCommand)
    .rejects(new Error('PipelineNotFoundException'));

  const assertion = expect(
    putApprovalResultManualTask({ pipelineName, result })
  ).rejects.toThrow('PipelineNotFoundException');

  await runPolls(1);
  await assertion;
});
