import { Command } from 'commander';
import AWS from 'aws-sdk';
import log from 'npmlog';

import type { Event, Status } from './lambdas/ecsTaskReport.handler';

const logPrefix = 'cicd-ecs-task-report';

/**
 * This method create the payload to send to Lambda ECS task report handler.
 *
 * @param param.status execution status.
 */
const sendEcsTaskReport = async ({ status }: { status: Status }) => {
  if (!process.env.ECS_TASK_REPORT_HANDLER_NAME) {
    log.info(logPrefix, 'ECS_TASK_REPORT_HANDLER_NAME not defined.');
    return;
  }

  const lambda = new AWS.Lambda();

  const payload: Event = { status };

  if (process.env.ECS_TASK_ARN) {
    payload.ecsTaskArn = process.env.ECS_TASK_ARN;
  }

  if (process.env.PIPELINE_NAME) {
    payload.pipelineName = process.env.PIPELINE_NAME;
  }

  await lambda
    .invokeAsync({
      FunctionName: process.env.ECS_TASK_REPORT_HANDLER_NAME,
      InvokeArgs: JSON.stringify(payload),
    })
    .promise();

  log.info(logPrefix, 'Report sent.');
};

/**
 * Used to send report to ECS Task Report Handler Lambda.
 */
export const ecsTaskReportCommand = new Command('cicd-ecs-task-report')
  .description('Send report to ECS Task Report Handler Lambda.')
  .requiredOption(
    '--status <status>',
    'Execution status (Approved, Rejected, MainTagFound)'
  )
  .action(async function (this: Command) {
    const opts = this.opts();
    await sendEcsTaskReport({ status: opts.status as Status });
  });
