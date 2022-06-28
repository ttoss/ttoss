import { ECS } from 'aws-sdk';
import { getProcessEnvVariable } from './getProcessEnvVariable';
import type { Status } from './ecsTaskReport.handler';

const ecs = new ECS({ apiVersion: '2014-11-13', maxRetries: 3 });

const compileCommands = (commands: string[]) => {
  return commands.map((c) => c.replace(/;$/, '')).join(' && ');
};

const approvedStatus: Status = 'Approved';

const rejectedStatus: Status = 'Rejected';

const successCommands = [
  `carlin cicd-ecs-task-report --status=${approvedStatus}`,
];

const failureCommands = [
  `carlin cicd-ecs-task-report --status=${rejectedStatus}`,
];

export const shConditionalCommands = ({
  conditionalCommands,
}: {
  conditionalCommands: string[];
  successCommands?: string[];
  failureCommands?: string[];
  finallyCommands?: string[];
}) => {
  const conditionalCommand = compileCommands(conditionalCommands);

  const successCommand = compileCommands([
    'echo "Success Command"',
    ...successCommands,
  ]);

  const failureCommand = compileCommands([
    'echo "Failure Command"',
    ...failureCommands,
  ]);

  const finallyCommand = compileCommands(['echo "Finally Command"']);

  return `if ${conditionalCommand}; then ${successCommand}; else ${failureCommand}; fi; ${finallyCommand}`;
};

export const executeTasks = async ({
  commands = [],
  cpu,
  memory,
  taskEnvironment = [],
  tags = [],
}: {
  commands: string[];
  cpu?: string;
  memory?: string;
  taskEnvironment?: Array<{ name: string; value: string }>;
  tags?: Array<{ key: string; value?: string }>;
}) => {
  const command = compileCommands([
    /**
     * https://stackoverflow.com/questions/2853803/how-to-echo-shell-commands-as-they-are-executed/2853811
     */
    'set -x',
    /**
     * https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-metadata-endpoint-v3.html
     */
    `export ECS_TASK_ARN=$(curl -X GET "\${ECS_CONTAINER_METADATA_URI}/task" | jq ".TaskARN")`,
    ...commands,
  ]);

  const response = await ecs
    .runTask({
      taskDefinition: getProcessEnvVariable('ECS_TASK_DEFINITION'),
      cluster: getProcessEnvVariable('ECS_CLUSTER_ARN'),
      count: 1,
      launchType: 'FARGATE',
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: [
            getProcessEnvVariable('VPC_PUBLIC_SUBNET_0'),
            getProcessEnvVariable('VPC_PUBLIC_SUBNET_1'),
            getProcessEnvVariable('VPC_PUBLIC_SUBNET_2'),
          ],
          assignPublicIp: 'ENABLED',
          securityGroups: [getProcessEnvVariable('VPC_SECURITY_GROUP')],
        },
      },
      overrides: {
        containerOverrides: [
          {
            command: ['sh', '-cv', command],
            name: getProcessEnvVariable('ECS_CONTAINER_NAME'),
            environment: [
              {
                name: 'CI',
                value: 'true',
              },
              {
                name: 'ECS_ENABLE_CONTAINER_METADATA',
                value: 'true',
              },
              {
                name: 'ECS_TASK_REPORT_HANDLER_NAME',
                value: getProcessEnvVariable('ECS_TASK_REPORT_HANDLER_NAME'),
              },
              ...taskEnvironment,
            ],
          },
        ],
        cpu,
        memory,
      },
      tags,
    })
    .promise();

  return response;
};
