import AWS from 'aws-sdk';

import {
  PIPELINE_ECS_TASK_EXECUTION_MANUAL_APPROVAL_ACTION_NAME,
  PIPELINE_ECS_TASK_EXECUTION_STAGE_NAME,
} from '../config';

const codepipeline = new AWS.CodePipeline();

const FIVE_SECONDS = 5 * 1000;

const getApprovalActionToken = ({
  actionName,
  stageName,
  pipelineName,
}: {
  actionName: string;
  stageName: string;
  pipelineName: string;
}) => {
  return new Promise<string>((resolve, reject) => {
    setTimeout(() => {
      codepipeline.getPipelineState(
        { name: pipelineName },
        async (err, { stageStates = [] }) => {
          if (err) {
            return reject(err);
          }

          const approvalStageState = stageStates.find((s) => {
            return s.stageName === stageName;
          });

          if (!approvalStageState) {
            throw new Error('ApprovalStageStateIsUndefined');
          }

          const approvalActionState = approvalStageState.actionStates?.find(
            (a) => {
              return a.actionName === actionName;
            }
          );

          if (!approvalActionState) {
            throw new Error('ApprovalActionStateIsUndefined');
          }

          const { latestExecution } = approvalActionState;

          if (latestExecution && latestExecution.status === 'InProgress') {
            return resolve(latestExecution.token as string);
          }

          try {
            return resolve(
              await getApprovalActionToken({
                actionName,
                stageName,
                pipelineName,
              })
            );
          } catch (error) {
            return reject(error);
          }
        }
      );
    }, FIVE_SECONDS);
  });
};

export const putApprovalResultManualTask = async ({
  pipelineName,
  result,
}: {
  pipelineName: string;
  result: AWS.CodePipeline.ApprovalResult;
}) => {
  const actionName = PIPELINE_ECS_TASK_EXECUTION_MANUAL_APPROVAL_ACTION_NAME;

  const stageName = PIPELINE_ECS_TASK_EXECUTION_STAGE_NAME;

  const token = await getApprovalActionToken({
    actionName,
    stageName,
    pipelineName,
  });

  await codepipeline
    .putApprovalResult({ pipelineName, stageName, actionName, result, token })
    .promise();
};
