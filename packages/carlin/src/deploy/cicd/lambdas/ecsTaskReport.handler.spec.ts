import { faker } from '@ttoss/test-utils/faker';
import { getEcsTaskLogsUrl } from './ecsTaskReport.handler';

const region = 'us-east-1';

process.env.AWS_REGION = region;

describe('testing getEcsTaskLogsUrl', () => {
  afterEach(() => {
    delete process.env.ECS_TASK_CONTAINER_NAME;
    delete process.env.ECS_TASK_LOGS_LOG_GROUP;
  });

  const taskId = faker.datatype.uuid();

  const ecsTaskContainerName = 'ecsTaskContainerName';

  const ecsTaskLogsLogGroup = 'ecsTaskLogsLogGroup';

  const ecsTaskArn = `arn:aws:ecs:us-east-1:483684946879:task/CarlinCicdCarlinMonorepo-RepositoryTasksECSCluster-1J6saGT91hCr/${taskId}`;

  test('return undefined if ECS_TASK_CONTAINER_NAME and ECS_TASK_LOGS_LOG_GROUP are undefined', () => {
    expect(getEcsTaskLogsUrl({ ecsTaskArn })).toBeUndefined();
  });

  test('return undefined if only ECS_TASK_CONTAINER_NAME is defined', () => {
    process.env.ECS_TASK_CONTAINER_NAME = ecsTaskContainerName;
    expect(getEcsTaskLogsUrl({ ecsTaskArn })).toBeUndefined();
  });

  test('return undefined if only ECS_TASK_LOGS_LOG_GROUP is defined', () => {
    process.env.ECS_TASK_LOGS_LOG_GROUP = ecsTaskLogsLogGroup;
    expect(getEcsTaskLogsUrl({ ecsTaskArn })).toBeUndefined();
  });

  test('return url', () => {
    process.env.ECS_TASK_CONTAINER_NAME = ecsTaskContainerName;
    process.env.ECS_TASK_LOGS_LOG_GROUP = ecsTaskLogsLogGroup;
    expect(getEcsTaskLogsUrl({ ecsTaskArn })).toEqual(
      `https://console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups/log-group/${ecsTaskLogsLogGroup}/log-events/ecs%252F${ecsTaskContainerName}%252F${taskId}`
    );
  });

  test('return url even with ecsTaskArn ending in "', () => {
    process.env.ECS_TASK_CONTAINER_NAME = ecsTaskContainerName;
    process.env.ECS_TASK_LOGS_LOG_GROUP = ecsTaskLogsLogGroup;
    expect(getEcsTaskLogsUrl({ ecsTaskArn: `${ecsTaskArn}"` })).toEqual(
      `https://console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups/log-group/${ecsTaskLogsLogGroup}/log-events/ecs%252F${ecsTaskContainerName}%252F${taskId}`
    );
  });
});
