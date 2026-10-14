/* eslint-disable @typescript-eslint/no-explicit-any */
import { CodeBuildClient, StartBuildCommand } from '@aws-sdk/client-codebuild';
import {
  DescribeTasksCommand,
  ECSClient,
  RunTaskCommand,
} from '@aws-sdk/client-ecs';
import { mockClient } from 'aws-sdk-client-mock';
import { cicdApiV1Handler } from 'src/deploy/cicd/lambdas/cicdApiV1.handler';
import {
  ecsTaskReportHandler,
  getEcsTaskTags,
} from 'src/deploy/cicd/lambdas/ecsTaskReport.handler';
import { executeTasks } from 'src/deploy/cicd/lambdas/executeTasks';
import { putApprovalResultManualTask } from 'src/deploy/cicd/lambdas/putApprovalResultManualTask';

jest.mock('src/deploy/cicd/lambdas/putApprovalResultManualTask', () => {
  return { putApprovalResultManualTask: jest.fn() };
});

const ecsMock = mockClient(ECSClient);
const codeBuildMock = mockClient(CodeBuildClient);

const taskEnvVariables = {
  ECS_TASK_DEFINITION: 'task-definition',
  ECS_CLUSTER_ARN: 'cluster-arn',
  VPC_PUBLIC_SUBNET_0: 'subnet-0',
  VPC_PUBLIC_SUBNET_1: 'subnet-1',
  VPC_PUBLIC_SUBNET_2: 'subnet-2',
  VPC_SECURITY_GROUP: 'security-group',
  ECS_CONTAINER_NAME: 'container-name',
  ECS_TASK_REPORT_HANDLER_NAME: 'report-handler',
  PROCESS_ENV_REPOSITORY_IMAGE_CODE_BUILD_PROJECT_NAME: 'image-project',
};

const ecsTaskArn =
  'arn:aws:ecs:us-east-1:123456789012:task/my-cluster/6fcc78682de442ae89a0b7339ac7d981';

beforeEach(() => {
  ecsMock.reset();
  codeBuildMock.reset();
  jest.clearAllMocks();
  Object.assign(process.env, taskEnvVariables);
});

afterEach(() => {
  for (const key of Object.keys(taskEnvVariables)) {
    delete process.env[key];
  }
});

describe('executeTasks', () => {
  test('should run a Fargate task with the commands', async () => {
    ecsMock.on(RunTaskCommand).resolves({ tasks: [{ taskArn: ecsTaskArn }] });

    const response = await executeTasks({
      commands: ['pnpm test'],
      cpu: '1024',
      memory: '2048',
      taskEnvironment: [{ name: 'FOO', value: 'bar' }],
      tags: [{ key: 'Pipeline', value: 'pr' }],
    });

    expect(response.tasks).toEqual([{ taskArn: ecsTaskArn }]);

    const { input } = ecsMock.commandCalls(RunTaskCommand)[0].args[0];

    expect(input).toMatchObject({
      taskDefinition: 'task-definition',
      cluster: 'cluster-arn',
      count: 1,
      launchType: 'FARGATE',
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: ['subnet-0', 'subnet-1', 'subnet-2'],
          assignPublicIp: 'ENABLED',
          securityGroups: ['security-group'],
        },
      },
      overrides: { cpu: '1024', memory: '2048' },
      tags: [{ key: 'Pipeline', value: 'pr' }],
    });

    const containerOverride = input.overrides?.containerOverrides?.[0];

    expect(containerOverride?.name).toEqual('container-name');
    expect(containerOverride?.command?.slice(0, 2)).toEqual(['sh', '-cv']);
    expect(containerOverride?.command?.[2]).toContain('pnpm test');
    expect(containerOverride?.environment).toEqual([
      { name: 'CI', value: 'true' },
      { name: 'ECS_ENABLE_CONTAINER_METADATA', value: 'true' },
      { name: 'ECS_TASK_REPORT_HANDLER_NAME', value: 'report-handler' },
      { name: 'FOO', value: 'bar' },
    ]);
  });

  test('should retry three times, as the AWS SDK v2 client did', async () => {
    ecsMock.on(RunTaskCommand).resolves({});

    await executeTasks({ commands: [] });

    const client = ecsMock.call(0).thisValue as ECSClient;
    await expect(client.config.maxAttempts()).resolves.toEqual(4);
  });
});

describe('cicdApiV1Handler', () => {
  const handler = (body?: any) => {
    return cicdApiV1Handler(
      { body: body && JSON.stringify(body) } as any,
      {} as any,
      jest.fn()
    );
  };

  test('should start the repository image build on updateRepository', async () => {
    codeBuildMock.on(StartBuildCommand).resolves({
      $metadata: { httpStatusCode: 200 },
      build: { id: 'build-id' },
    });

    const response = await handler({ action: 'updateRepository' });

    expect(
      codeBuildMock.commandCalls(StartBuildCommand)[0].args[0].input
    ).toEqual({ projectName: 'image-project' });
    expect(response).toEqual({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ build: { id: 'build-id' } }),
    });
  });

  test('should run the commands on executeTask', async () => {
    ecsMock.on(RunTaskCommand).resolves({
      $metadata: { httpStatusCode: 200 },
      tasks: [{ taskArn: ecsTaskArn }],
    });

    const response: any = await handler({
      action: 'executeTask',
      commands: ['pnpm test'],
    });

    expect(ecsMock.commandCalls(RunTaskCommand)).toHaveLength(1);
    expect(JSON.parse(response.body)).toEqual({
      tasks: [{ taskArn: ecsTaskArn }],
    });
  });

  test('should return 400 if executeTask has no commands', async () => {
    const response = await handler({ action: 'executeTask' });

    expect(response).toEqual({
      statusCode: 400,
      body: 'Commands were not provided.',
    });
  });

  test('should return 403 for unknown actions', async () => {
    const response = await handler();

    expect(response).toEqual({
      statusCode: 403,
      body: 'Execute access forbidden',
    });
  });
});

describe('ecsTaskReportHandler', () => {
  test('getEcsTaskTags should return the task tags', async () => {
    ecsMock.on(DescribeTasksCommand).resolves({
      tasks: [{ tags: [{ key: 'Pipeline', value: 'main' }] }],
    });

    await expect(getEcsTaskTags({ ecsTaskArn })).resolves.toEqual([
      { key: 'Pipeline', value: 'main' },
    ]);

    expect(ecsMock.commandCalls(DescribeTasksCommand)[0].args[0].input).toEqual(
      { cluster: 'my-cluster', include: ['TAGS'], tasks: [ecsTaskArn] }
    );
  });

  test('getEcsTaskTags should return undefined without tasks', async () => {
    ecsMock.on(DescribeTasksCommand).resolves({ tasks: [] });

    await expect(getEcsTaskTags({ ecsTaskArn })).resolves.toBeUndefined();
  });

  test('getEcsTaskTags should return undefined on error', async () => {
    ecsMock.on(DescribeTasksCommand).rejects(new Error('AccessDenied'));

    await expect(getEcsTaskTags({ ecsTaskArn })).resolves.toBeUndefined();
  });

  test('should put the approval result of the pipeline', async () => {
    ecsMock.on(DescribeTasksCommand).resolves({ tasks: [] });

    const response = await ecsTaskReportHandler(
      { status: 'MainTagFound', ecsTaskArn, pipelineName: 'pipeline-name' },
      {} as any,
      jest.fn()
    );

    expect(putApprovalResultManualTask).toHaveBeenCalledWith({
      pipelineName: 'pipeline-name',
      result: {
        status: 'Approved',
        summary: JSON.stringify({ status: 'MainTagFound' }),
      },
    });
    expect(response).toEqual({ statusCode: 200, body: 'ok' });
  });
});
