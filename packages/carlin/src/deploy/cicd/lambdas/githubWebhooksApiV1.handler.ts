import { Pipeline, getClosedPrCommands, getPrCommands } from '../pipelines';
import { ProxyHandler } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { Webhooks } from '@octokit/webhooks';
import { executeTasks, shConditionalCommands } from './executeTasks';
import { getProcessEnvVariable } from './getProcessEnvVariable';
import { getTriggerPipelinesObjectKey } from '../getTriggerPipelineObjectKey';
import AdmZip from 'adm-zip';

const s3 = new S3();

/**
 * When this file is saved on S3, a CodePipeline pipeline is started.
 */
const putJobDetails = async ({
  pipeline,
  details,
}: {
  pipeline: Pipeline;
  details: any;
}) => {
  const prefix = getProcessEnvVariable('TRIGGER_PIPELINES_OBJECT_KEY_PREFIX');

  const zip = new AdmZip();

  const content = JSON.stringify(details);

  zip.addFile(pipeline, Buffer.from(content));

  return s3
    .putObject({
      Body: zip.toBuffer(),
      Bucket: getProcessEnvVariable('BASE_STACK_BUCKET_NAME'),
      Key: getTriggerPipelinesObjectKey({ prefix, pipeline }),
    })
    .promise();
};

/**
 * Put outside of the handler to be able to spy on it.
 */
export const webhooks = new Webhooks({ secret: '123' });

const getPipelines = () => {
  const pipelines: Pipeline[] = JSON.parse(
    process.env.PIPELINES_JSON || JSON.stringify([])
  );

  return pipelines;
};

webhooks.on('push', async (details) => {
  if (!getPipelines().includes('tag')) {
    return;
  }

  if (details.payload.ref.startsWith('refs/tags/')) {
    await putJobDetails({ pipeline: 'tag', details });
  }
});

webhooks.on('push', async (details) => {
  if (!getPipelines().includes('main')) {
    return;
  }

  if (details.payload.ref === 'refs/heads/main') {
    await putJobDetails({ pipeline: 'main', details });
  }
});

webhooks.on(
  ['pull_request.opened', 'pull_request.reopened', 'pull_request.synchronize'],
  async ({ payload }) => {
    if (!getPipelines().includes('pr')) {
      return;
    }

    if (payload.pull_request.draft) {
      return;
    }

    await executeTasks({
      commands: [
        shConditionalCommands({
          conditionalCommands: getPrCommands({
            branch: payload.pull_request.head.ref,
          }),
        }),
      ],
      tags: [
        { key: 'Pipeline', value: 'pr' },
        { key: 'PullRequest', value: payload.number.toString() },
        { key: 'PullRequestUrl', value: payload.pull_request.url },
        { key: 'Action', value: payload.action },
        { key: 'Branch', value: payload.pull_request.head.ref },
      ],
    });
  }
);

webhooks.on(['pull_request.closed'], async ({ payload }) => {
  if (!getPipelines().includes('pr')) {
    return;
  }

  /**
   * https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html
   */
  await executeTasks({
    cpu: '512',
    memory: '2048',
    commands: [
      shConditionalCommands({
        conditionalCommands: getClosedPrCommands({
          branch: payload.pull_request.head.ref,
        }),
      }),
    ],
    tags: [
      { key: 'Pipeline', value: 'pr' },
      { key: 'PullRequest', value: payload.number.toString() },
      { key: 'PullRequestTitle', value: payload.pull_request.title },
      { key: 'PullRequestUrl', value: payload.pull_request.url },
      { key: 'Action', value: payload.action },
      { key: 'Branch', value: payload.pull_request.head.ref },
    ],
  });
});

export const githubWebhooksApiV1Handler: ProxyHandler = async (
  event,
  context
) => {
  try {
    /**
     * Ends function immediately after callback.
     */
    context.callbackWaitsForEmptyEventLoop = false;

    const { body, headers } = event;

    if (!body) {
      throw new Error("event.body doesn't exist.");
    }

    const xGitHubDelivery = headers['X-GitHub-Delivery'];
    const xGitHubEvent = headers['X-GitHub-Event'];
    const xHubSignature =
      headers['X-Hub-Signature-256'] || headers['X-Hub-Signature'];

    if (!xGitHubDelivery) {
      throw new Error("X-GitHub-Delivery doesn't exist.");
    }

    if (!xGitHubEvent) {
      throw new Error("X-GitHub-Event doesn't exist.");
    }

    if (!xHubSignature) {
      throw new Error("X-Hub-Signature-256 or X-Hub-Signature doesn't exist.");
    }

    webhooks.onError((onErrorEvent) => {
      throw onErrorEvent;
    });

    /**
     * Replace "receive" for "verifyAndReceive" when WebCrypto exist on Node.js
     * API.
     */
    await webhooks.receive({
      id: xGitHubDelivery,
      name: xGitHubEvent as any,
      // signature: xHubSignature,
      payload: JSON.parse(body),
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (error: any) {
    return { statusCode: error.status || 500, body: error.message };
  }
};
