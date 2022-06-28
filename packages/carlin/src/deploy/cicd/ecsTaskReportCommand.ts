import { CommandModule, InferredOptionTypes } from 'yargs';
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

const options = {
  status: {
    choices: ['Approved', 'Rejected', 'MainTagFound'] as Status[],
    demandOption: true,
    type: 'string',
  },
} as const;

/**
 * Used to send report to ECS Task Report Handler Lambda.
 */
export const ecsTaskReportCommand: CommandModule<
  any,
  InferredOptionTypes<typeof options>
> = {
  command: 'cicd-ecs-task-report',
  describe: false,
  builder: (yargs) => yargs.options(options),
  handler: async (args) => {
    return sendEcsTaskReport(args as any);
  },
};
