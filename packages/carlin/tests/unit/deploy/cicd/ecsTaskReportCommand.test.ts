import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { sendEcsTaskReport } from 'src/deploy/cicd/ecsTaskReportCommand';
import { setEnvVar } from 'src/utils/environmentVariables';

const lambdaMock = mockClient(LambdaClient);

beforeEach(() => {
  lambdaMock.reset();
  setEnvVar('REGION', 'us-east-2');
  delete process.env.ECS_TASK_REPORT_HANDLER_NAME;
  delete process.env.ECS_TASK_ARN;
  delete process.env.PIPELINE_NAME;
});

test('should not invoke the handler if its name is not defined', async () => {
  await sendEcsTaskReport({ status: 'Approved' });

  expect(lambdaMock.calls()).toHaveLength(0);
});

test('should invoke the handler asynchronously with the report', async () => {
  process.env.ECS_TASK_REPORT_HANDLER_NAME = 'report-handler';
  process.env.ECS_TASK_ARN = 'task-arn';
  process.env.PIPELINE_NAME = 'pipeline-name';

  lambdaMock.on(InvokeCommand).resolves({ StatusCode: 202 });

  await sendEcsTaskReport({ status: 'Rejected' });

  const calls = lambdaMock.commandCalls(InvokeCommand);
  expect(calls).toHaveLength(1);
  expect(calls[0].args[0].input).toEqual({
    FunctionName: 'report-handler',
    InvocationType: 'Event',
    Payload: JSON.stringify({
      status: 'Rejected',
      ecsTaskArn: 'task-arn',
      pipelineName: 'pipeline-name',
    }),
  });

  const client = lambdaMock.call(0).thisValue as LambdaClient;
  await expect(client.config.region()).resolves.toEqual('us-east-2');
});

test('should send only the status when task and pipeline are unknown', async () => {
  process.env.ECS_TASK_REPORT_HANDLER_NAME = 'report-handler';

  lambdaMock.on(InvokeCommand).resolves({ StatusCode: 202 });

  await sendEcsTaskReport({ status: 'MainTagFound' });

  expect(
    lambdaMock.commandCalls(InvokeCommand)[0].args[0].input.Payload
  ).toEqual(JSON.stringify({ status: 'MainTagFound' }));
});
