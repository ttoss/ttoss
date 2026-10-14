import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import type { CommandModule, InferredOptionTypes } from 'yargs';

import { getEnvVar } from '../../utils/environmentVariables';
import { log } from '../../utils/log';
import type { Event, Status } from './lambdas/ecsTaskReport.handler';

const logPrefix = 'cicd-ecs-task-report';

/**
 * This method create the payload to send to Lambda ECS task report handler.
 *
 * @param param.status execution status.
 */
export const sendEcsTaskReport = async ({ status }: { status: Status }) => {
  if (!process.env.ECS_TASK_REPORT_HANDLER_NAME) {
    log.info(logPrefix, 'ECS_TASK_REPORT_HANDLER_NAME not defined.');
    return;
  }

  const lambda = new LambdaClient({ region: getEnvVar('REGION') });

  const payload: Event = { status };

  if (process.env.ECS_TASK_ARN) {
    payload.ecsTaskArn = process.env.ECS_TASK_ARN;
  }

  if (process.env.PIPELINE_NAME) {
    payload.pipelineName = process.env.PIPELINE_NAME;
  }

  /**
   * `Event` invokes the function asynchronously, replacing the deprecated
   * InvokeAsync API.
   */
  await lambda.send(
    new InvokeCommand({
      FunctionName: process.env.ECS_TASK_REPORT_HANDLER_NAME,
      InvocationType: 'Event',
      Payload: JSON.stringify(payload),
    })
  );

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  InferredOptionTypes<typeof options>
> = {
  command: 'cicd-ecs-task-report',
  describe: false,
  builder: (yargs) => {
    return yargs.options(options);
  },
  handler: async (args) => {
    return sendEcsTaskReport({ status: args.status as Status });
  },
};
