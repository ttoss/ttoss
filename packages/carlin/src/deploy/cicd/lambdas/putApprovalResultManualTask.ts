import {
  type ApprovalResult,
  CodePipelineClient,
  GetPipelineStateCommand,
  PutApprovalResultCommand,
} from '@aws-sdk/client-codepipeline';

import {
  PIPELINE_ECS_TASK_EXECUTION_MANUAL_APPROVAL_ACTION_NAME,
  PIPELINE_ECS_TASK_EXECUTION_STAGE_NAME,
} from '../config';

const codepipeline = new CodePipelineClient({});

const FIVE_SECONDS = 5 * 1000;

const wait = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

/**
 * Poll the pipeline state every five seconds until the approval action is in
 * progress, then return its token.
 */
const getApprovalActionToken = async ({
  actionName,
  stageName,
  pipelineName,
}: {
  actionName: string;
  stageName: string;
  pipelineName: string;
}): Promise<string> => {
  await wait(FIVE_SECONDS);

  const { stageStates = [] } = await codepipeline.send(
    new GetPipelineStateCommand({ name: pipelineName })
  );

  const approvalStageState = stageStates.find((s) => {
    return s.stageName === stageName;
  });

  if (!approvalStageState) {
    throw new Error('ApprovalStageStateIsUndefined');
  }

  const approvalActionState = approvalStageState.actionStates?.find((a) => {
    return a.actionName === actionName;
  });

  if (!approvalActionState) {
    throw new Error('ApprovalActionStateIsUndefined');
  }

  const { latestExecution } = approvalActionState;

  if (latestExecution && latestExecution.status === 'InProgress') {
    return latestExecution.token as string;
  }

  return getApprovalActionToken({ actionName, stageName, pipelineName });
};

export const putApprovalResultManualTask = async ({
  pipelineName,
  result,
}: {
  pipelineName: string;
  result: ApprovalResult;
}) => {
  const actionName = PIPELINE_ECS_TASK_EXECUTION_MANUAL_APPROVAL_ACTION_NAME;

  const stageName = PIPELINE_ECS_TASK_EXECUTION_STAGE_NAME;

  const token = await getApprovalActionToken({
    actionName,
    stageName,
    pipelineName,
  });

  await codepipeline.send(
    new PutApprovalResultCommand({
      pipelineName,
      stageName,
      actionName,
      result,
      token,
    })
  );
};
