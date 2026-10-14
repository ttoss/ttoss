/* eslint-disable @typescript-eslint/no-explicit-any */
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { executeTasks } from 'src/deploy/cicd/lambdas/executeTasks';
import {
  githubWebhooksApiV1Handler,
  webhooks,
} from 'src/deploy/cicd/lambdas/githubWebhooksApiV1.handler';

const s3Mock = mockClient(S3Client);

jest.mock('src/deploy/cicd/lambdas/executeTasks', () => {
  return {
    executeTasks: jest.fn(),
    shConditionalCommands: jest.fn(),
  };
});

const context = {} as any;

const callback = jest.fn();

const handler = (event: any) => {
  return githubWebhooksApiV1Handler(event, context, callback);
};

const xGitHubDelivery = 'xGitHubDelivery';

const xGitHubEvent = 'xGitHubEvent';

const xHubSignature = 'xHubSignature';

const webhooksReceiveMock = jest.spyOn(webhooks, 'receive');

const expectSinglePutObject = ({ key }: { key: string }) => {
  const calls = s3Mock.commandCalls(PutObjectCommand);
  expect(calls).toHaveLength(1);
  expect(calls[0].args[0].input).toEqual({
    Body: expect.any(Buffer),
    Bucket: 'base-stack',
    Key: key,
  });
};

beforeEach(() => {
  delete process.env.PIPELINES_JSON;
  delete process.env.TRIGGER_PIPELINES_OBJECT_KEY_PREFIX;
  delete process.env.BASE_STACK_BUCKET_NAME;
  s3Mock.reset();
});

afterEach(() => {
  jest.clearAllMocks();
});

test.each([['opened'], ['reopened'], ['synchronize']])(
  'should execute pr handler with action %s',
  async (action) => {
    process.env.PIPELINES_JSON = JSON.stringify(['main', 'pr']);

    const response = await handler({
      headers: {
        'X-GitHub-Delivery': xGitHubDelivery,
        'X-GitHub-Event': 'pull_request',
        'X-Hub-Signature-256': xHubSignature,
      },
      body: JSON.stringify({
        action,
        number: 1,
        pull_request: {
          draft: false,
          head: {},
        },
      }),
    });

    expect(executeTasks).toHaveBeenCalledTimes(1);

    expect(response).toMatchObject({ body: '{"ok":true}', statusCode: 200 });
  }
);

test('should execute main handler only one time per webhook', async () => {
  process.env.PIPELINES_JSON = JSON.stringify(['main', 'pr']);
  process.env.TRIGGER_PIPELINES_OBJECT_KEY_PREFIX = 'some/prefix';
  process.env.BASE_STACK_BUCKET_NAME = 'base-stack';

  /**
   * Execute first to add the main and pr listeners.
   */
  await handler({
    headers: {
      'X-GitHub-Delivery': xGitHubDelivery,
      'X-GitHub-Event': 'push',
      'X-Hub-Signature-256': xHubSignature,
    },
    body: JSON.stringify({}),
  });

  await handler({
    headers: {
      'X-GitHub-Delivery': xGitHubDelivery,
      'X-GitHub-Event': 'push',
      'X-Hub-Signature-256': xHubSignature,
    },
    body: JSON.stringify({ ref: 'refs/heads/main' }),
  });

  expectSinglePutObject({ key: 'some/prefix/main.zip' });
});

test('should call S3 putObject for tag', async () => {
  process.env.PIPELINES_JSON = JSON.stringify(['tag', 'main']);
  process.env.TRIGGER_PIPELINES_OBJECT_KEY_PREFIX = 'some/prefix';
  process.env.BASE_STACK_BUCKET_NAME = 'base-stack';

  const body = { ref: 'refs/heads/main' };

  const response: any = await handler({
    headers: {
      'X-GitHub-Delivery': xGitHubDelivery,
      'X-GitHub-Event': 'push',
      'X-Hub-Signature-256': xHubSignature,
    },
    body: JSON.stringify(body),
  });

  expectSinglePutObject({ key: 'some/prefix/main.zip' });

  expect(response).toMatchObject({ body: '{"ok":true}', statusCode: 200 });
});

test('should call S3 putObject for main', async () => {
  process.env.PIPELINES_JSON = JSON.stringify(['tag', 'main']);
  process.env.TRIGGER_PIPELINES_OBJECT_KEY_PREFIX = 'some/prefix';
  process.env.BASE_STACK_BUCKET_NAME = 'base-stack';

  const body = { ref: 'refs/tags/' };

  const response: any = await handler({
    headers: {
      'X-GitHub-Delivery': xGitHubDelivery,
      'X-GitHub-Event': 'push',
      'X-Hub-Signature-256': xHubSignature,
    },
    body: JSON.stringify(body),
  });

  expectSinglePutObject({ key: 'some/prefix/tag.zip' });

  expect(response).toMatchObject({ body: '{"ok":true}', statusCode: 200 });
});

test('should throw process.env.BASE_STACK_BUCKET_NAME is not defined', async () => {
  process.env.PIPELINES_JSON = JSON.stringify(['main']);
  process.env.TRIGGER_PIPELINES_OBJECT_KEY_PREFIX = 'some/prefix';

  const body = { ref: 'refs/heads/main' };

  const response: any = await handler({
    headers: {
      'X-GitHub-Delivery': xGitHubDelivery,
      'X-GitHub-Event': 'push',
      'X-Hub-Signature-256': xHubSignature,
    },
    body: JSON.stringify(body),
  });

  expect(webhooksReceiveMock).toHaveBeenCalledWith({
    id: xGitHubDelivery,
    name: 'push',
    payload: body,
  });

  expect(response.statusCode).toBe(500);
  expect(response.body).toContain(
    'process.env.BASE_STACK_BUCKET_NAME is not defined.'
  );
});

test('should throw process.env.TRIGGER_PIPELINES_OBJECT_KEY_PREFIX is not defined', async () => {
  process.env.PIPELINES_JSON = JSON.stringify(['main']);

  const body = { ref: 'refs/heads/main' };

  const response: any = await handler({
    headers: {
      'X-GitHub-Delivery': xGitHubDelivery,
      'X-GitHub-Event': 'push',
      'X-Hub-Signature-256': xHubSignature,
    },
    body: JSON.stringify(body),
  });

  expect(webhooksReceiveMock).toHaveBeenCalledWith({
    id: xGitHubDelivery,
    name: 'push',
    payload: body,
  });

  expect(response.statusCode).toBe(500);
  expect(response.body).toContain(
    'process.env.TRIGGER_PIPELINES_OBJECT_KEY_PREFIX is not defined'
  );
});

test('should call webhook.receive properly', async () => {
  const body = { someProperty: 'someValue' };

  const response = await handler({
    headers: {
      'X-GitHub-Delivery': xGitHubDelivery,
      'X-GitHub-Event': xGitHubEvent,
      'X-Hub-Signature-256': xHubSignature,
    },
    body: JSON.stringify(body),
  });

  expect(webhooksReceiveMock).toHaveBeenCalledWith({
    id: xGitHubDelivery,
    name: xGitHubEvent,
    payload: body,
  });
  expect(response).toMatchObject({ body: '{"ok":true}', statusCode: 200 });
});

test("should return event.body doesn't exist", async () => {
  const response = await handler({});
  expect(response).toEqual({
    body: "event.body doesn't exist.",
    statusCode: 500,
  });
});

test("should return X-GitHub-Delivery doesn't exist", async () => {
  const response = await handler({ headers: {}, body: '{}' });
  expect(response).toEqual({
    body: "X-GitHub-Delivery doesn't exist.",
    statusCode: 500,
  });
});

test("should return X-GitHub-Event doesn't exist", async () => {
  const response = await handler({
    headers: { 'X-GitHub-Delivery': xGitHubDelivery },
    body: '{}',
  });
  expect(response).toEqual({
    body: "X-GitHub-Event doesn't exist.",
    statusCode: 500,
  });
});

test("should return X-Hub-Signature-256 or X-Hub-Signature doesn't exist", async () => {
  const response = await handler({
    headers: {
      'X-GitHub-Delivery': xGitHubDelivery,
      'X-GitHub-Event': xGitHubEvent,
    },
    body: '{}',
  });
  expect(response).toEqual({
    body: "X-Hub-Signature-256 or X-Hub-Signature doesn't exist.",
    statusCode: 500,
  });
});
