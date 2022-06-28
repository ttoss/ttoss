import { ECS } from 'aws-sdk';
import { Handler } from 'aws-lambda';
import { IncomingWebhook } from '@slack/webhook';
import { putApprovalResultManualTask } from './putApprovalResultManualTask';

const ecs = new ECS({ apiVersion: '2014-11-13' });

const getEcsTaskId = ({ ecsTaskArn }: { ecsTaskArn: string }) => {
  /**
   * Arn has the following format:
   * arn:aws:ecs:us-east-1:483684946879:task/CarlinCicdCarlinMonorepo-RepositoryTasksECSCluster-1J6saGT91hCr/6fcc78682de442ae89a0b7339ac7d981
   *
   * We want the "6fcc78682de442ae89a0b7339ac7d981" part.
   */
  const ecsTaskId = ecsTaskArn.split('/')[2];

  return ecsTaskId;
};

const getEcsTaskCluster = ({ ecsTaskArn }: { ecsTaskArn: string }) => {
  /**
   * Arn has the following format:
   * arn:aws:ecs:us-east-1:483684946879:task/CarlinCicdCarlinMonorepo-RepositoryTasksECSCluster-1J6saGT91hCr/6fcc78682de442ae89a0b7339ac7d981
   *
   * We want the "CarlinCicdCarlinMonorepo-RepositoryTasksECSCluster-1J6saGT91hCr" part.
   */
  const ecsTaskCluster = ecsTaskArn.split('/')[1];

  return ecsTaskCluster;
};

export const getEcsTaskLogsUrl = ({ ecsTaskArn }: { ecsTaskArn: string }) => {
  if (
    !process.env.ECS_TASK_CONTAINER_NAME ||
    !process.env.ECS_TASK_LOGS_LOG_GROUP
  ) {
    return undefined;
  }

  const ecsTaskId = getEcsTaskId({ ecsTaskArn });

  const ecsTaskLogsUrl = new URL(
    [
      /**
       * https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime
       */
      `https://console.aws.amazon.com/cloudwatch/home?region=${process.env.AWS_REGION}#logsV2:log-groups`,
      'log-group',
      process.env.ECS_TASK_LOGS_LOG_GROUP,
      'log-events',
      `ecs/${process.env.ECS_TASK_CONTAINER_NAME}/${ecsTaskId}`.replace(
        /\//g,
        '%252F'
      ),
    ]
      .join('/')
      .replace(/"/g, '')
  );

  return ecsTaskLogsUrl.href;
};

export const getEcsTaskTags = async ({
  ecsTaskArn,
}: {
  ecsTaskArn: string;
}) => {
  try {
    const cluster = getEcsTaskCluster({ ecsTaskArn });

    const { tasks } = await ecs
      .describeTasks({ cluster, include: ['TAGS'], tasks: [ecsTaskArn] })
      .promise();

    const task = tasks?.[0];

    if (!task) {
      return undefined;
    }

    return task.tags;
  } catch (error) {
    return undefined;
  }
};

getEcsTaskTags({
  ecsTaskArn:
    'arn:aws:ecs:us-east-1:483684946879:task/CarlinCicdCarlinMonorepo-RepositoryTasksECSCluster-1J6saGT91hCr/f70d559c47804d6383df170712d3e455',
}).then();

/**
 * - MainTagFound: means that the main has a tag, so the main pipeline should
 * be skipped because the push was only to update versions and changelogs.
 */
export type Status = 'Approved' | 'Rejected' | 'MainTagFound';

export type Event = {
  status: Status;
  ecsTaskArn?: string;
  pipelineName?: string;
};

/**
 * This method is invoked when an ECS task is executed and the success or
 * failure commands calls `carlin cicd-ecs-task-report --status=<status>`.
 */
export const ecsTaskReportHandler: Handler<Event> = async ({
  ecsTaskArn,
  status,
  pipelineName,
}) => {
  const logs = ecsTaskArn && getEcsTaskLogsUrl({ ecsTaskArn });

  const handleApprovalResult = async () => {
    if (pipelineName) {
      await putApprovalResultManualTask({
        pipelineName,
        result: {
          status: status === 'MainTagFound' ? 'Approved' : status,
          summary: JSON.stringify({ status, logs }),
        },
      });
    }
  };

  const ecsTaskTags = ecsTaskArn && (await getEcsTaskTags({ ecsTaskArn }));

  const handleStackNotification = async () => {
    /**
     * Do not send a notification if the task was main pipeline with tag.
     */
    if (status === 'MainTagFound') {
      return;
    }

    const url = process.env.SLACK_WEBHOOK_URL;

    if (!url) {
      return;
    }

    const webhook = new IncomingWebhook(url);

    /**
     * Block Kit Builder: https://app.slack.com/block-kit-builder/TJ79J0ZU3#%7B%22blocks%22:%5B%5D%7D
     * Formatting: https://api.slack.com/reference/surfaces/formatting
     */
    await webhook.send({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<${logs}|Logs>`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `\`\`\`${JSON.stringify(
              {
                status,
                pipelineName,
                ecsTaskTags,
              },
              null,
              2
            )}\`\`\``,
          },
        },
      ],
    });
  };

  await Promise.all([handleApprovalResult(), handleStackNotification()]);

  return { statusCode: 200, body: 'ok' };
};
