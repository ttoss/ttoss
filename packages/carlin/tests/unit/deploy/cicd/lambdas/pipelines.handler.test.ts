/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'node:fs';

import {
  CodePipelineClient,
  GetJobDetailsCommand,
  PutJobFailureResultCommand,
  PutJobSuccessResultCommand,
} from '@aws-sdk/client-codepipeline';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import AdmZip from 'adm-zip';
import { mockClient } from 'aws-sdk-client-mock';
import { executeTasks } from 'src/deploy/cicd/lambdas/executeTasks';
import {
  getJobDetails,
  pipelinesHandler,
} from 'src/deploy/cicd/lambdas/pipelines.handler';
import { putApprovalResultManualTask } from 'src/deploy/cicd/lambdas/putApprovalResultManualTask';

jest.mock('src/deploy/cicd/lambdas/executeTasks', () => {
  return { executeTasks: jest.fn() };
});

jest.mock('src/deploy/cicd/lambdas/putApprovalResultManualTask', () => {
  return { putApprovalResultManualTask: jest.fn() };
});

const codePipelineMock = mockClient(CodePipelineClient);
const s3Mock = mockClient(S3Client);

const jobId = 'job-id';

const artifactCredentials = {
  accessKeyId: 'access-key-id',
  secretAccessKey: 'secret-access-key',
  sessionToken: 'session-token',
  expirationTime: 0,
};

const getEvent = ({ pipeline }: { pipeline: string }) => {
  return {
    'CodePipeline.job': {
      id: jobId,
      accountId: 'account-id',
      data: {
        actionConfiguration: {
          configuration: {
            FunctionName: 'function-name',
            UserParameters: `${pipeline}&stage`,
          },
        },
        inputArtifacts: [
          {
            location: {
              s3Location: { bucketName: 'bucket', objectKey: 'object-key' },
              type: 'S3',
            },
            revision: null,
            name: 'input',
          },
        ],
        outputArtifacts: [],
        artifactCredentials,
      },
    },
  } as any;
};

/**
 * The input artifact is a zip with the GitHub webhook details saved in a file
 * named after the pipeline.
 */
const mockInputArtifact = ({
  pipeline,
  payload,
}: {
  pipeline: string;
  payload: any;
}) => {
  const zip = new AdmZip();
  zip.addFile(pipeline, Buffer.from(JSON.stringify({ payload })));
  const body = zip.toBuffer();

  s3Mock.on(GetObjectCommand).resolves({
    Body: {
      transformToByteArray: () => {
        return Promise.resolve(new Uint8Array(body));
      },
    } as any,
  });
};

beforeEach(() => {
  codePipelineMock.reset();
  s3Mock.reset();
  jest.clearAllMocks();
});

afterAll(() => {
  fs.rmSync(`/tmp/${jobId}.zip`, { force: true });
});

describe('getJobDetails', () => {
  test('should read the input artifact with the artifact credentials', async () => {
    mockInputArtifact({ pipeline: 'main', payload: { after: 'sha' } });

    await expect(
      getJobDetails(getEvent({ pipeline: 'main' }))
    ).resolves.toEqual({ payload: { after: 'sha' } });

    expect(s3Mock.commandCalls(GetObjectCommand)[0].args[0].input).toEqual({
      Bucket: 'bucket',
      Key: 'object-key',
    });

    const client = s3Mock.call(0).thisValue as S3Client;
    await expect(client.config.credentials()).resolves.toMatchObject({
      accessKeyId: 'access-key-id',
      secretAccessKey: 'secret-access-key',
      sessionToken: 'session-token',
    });
  });

  test('should throw if the input artifact has no body', async () => {
    s3Mock.on(GetObjectCommand).resolves({});

    await expect(getJobDetails(getEvent({ pipeline: 'main' }))).rejects.toThrow(
      'Cannot retrieve the job description (there is no input artifact).'
    );
  });
});

describe('pipelinesHandler', () => {
  const handler = (event: any) => {
    return pipelinesHandler(event, {} as any, jest.fn());
  };

  test('should execute the main tasks and put the job success', async () => {
    mockInputArtifact({ pipeline: 'main', payload: { after: 'sha' } });
    codePipelineMock.on(GetJobDetailsCommand).resolves({
      jobDetails: {
        id: jobId,
        data: { pipelineContext: { pipelineName: 'pipeline-name' } },
      },
    });
    codePipelineMock.on(PutJobSuccessResultCommand).resolves({});

    await handler(getEvent({ pipeline: 'main' }));

    expect(executeTasks).toHaveBeenCalledWith({
      commands: [expect.any(String)],
      tags: [
        { key: 'Pipeline', value: 'main' },
        { key: 'AfterCommit', value: 'sha' },
        { key: 'PipelineName', value: 'pipeline-name' },
      ],
      taskEnvironment: [{ name: 'PIPELINE_NAME', value: 'pipeline-name' }],
    });
    expect(
      codePipelineMock.commandCalls(GetJobDetailsCommand)[0].args[0].input
    ).toEqual({ jobId });
    expect(
      codePipelineMock.commandCalls(PutJobSuccessResultCommand)[0].args[0].input
    ).toEqual({ jobId });
  });

  test('should execute the tag tasks', async () => {
    mockInputArtifact({
      pipeline: 'tag',
      payload: { after: 'sha', ref: 'refs/tags/v1.0.0' },
    });
    codePipelineMock.on(GetJobDetailsCommand).resolves({});
    codePipelineMock.on(PutJobSuccessResultCommand).resolves({});

    await handler(getEvent({ pipeline: 'tag' }));

    expect(executeTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: [
          { key: 'Pipeline', value: 'tag' },
          { key: 'AfterCommit', value: 'sha' },
          { key: 'Tag', value: 'v1.0.0' },
        ],
      })
    );
  });

  test('should reject the approval and put the job failure on error', async () => {
    mockInputArtifact({ pipeline: 'main', payload: { after: 'sha' } });
    codePipelineMock.on(GetJobDetailsCommand).resolves({
      jobDetails: {
        id: jobId,
        data: { pipelineContext: { pipelineName: 'pipeline-name' } },
      },
    });
    codePipelineMock.on(PutJobFailureResultCommand).resolves({});
    jest.mocked(executeTasks).mockRejectedValueOnce(new Error('RunTaskFailed'));

    await handler(getEvent({ pipeline: 'main' }));

    expect(putApprovalResultManualTask).toHaveBeenCalledWith({
      pipelineName: 'pipeline-name',
      result: { status: 'Rejected', summary: 'RunTaskFailed' },
    });
    expect(
      codePipelineMock.commandCalls(PutJobFailureResultCommand)[0].args[0].input
    ).toEqual({
      jobId,
      failureDetails: { type: 'JobFailed', message: 'RunTaskFailed' },
    });
    expect(
      codePipelineMock.commandCalls(PutJobSuccessResultCommand)
    ).toHaveLength(0);
  });

  test('should put the job failure for an unknown pipeline', async () => {
    mockInputArtifact({ pipeline: 'pr', payload: {} });
    codePipelineMock.on(GetJobDetailsCommand).resolves({});
    codePipelineMock.on(PutJobFailureResultCommand).resolves({});

    await handler(getEvent({ pipeline: 'pr' }));

    expect(putApprovalResultManualTask).not.toHaveBeenCalled();
    expect(
      codePipelineMock.commandCalls(PutJobFailureResultCommand)[0].args[0].input
    ).toEqual({
      jobId,
      failureDetails: {
        type: 'JobFailed',
        message: 'executeTasksInputUndefined',
      },
    });
  });
});
