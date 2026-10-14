import * as fs from 'node:fs';

import {
  CodePipelineClient,
  GetJobDetailsCommand,
  PutJobFailureResultCommand,
  PutJobSuccessResultCommand,
} from '@aws-sdk/client-codepipeline';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import AdmZip from 'adm-zip';
import type { CodePipelineEvent, CodePipelineHandler } from 'aws-lambda';

import { getMainCommands, getTagCommands, type Pipeline } from '../pipelines';
import { executeTasks } from './executeTasks';
import { putApprovalResultManualTask } from './putApprovalResultManualTask';
import { shConditionalCommands } from './shConditionalCommands';

const codepipeline = new CodePipelineClient({});

const getUserParameters = (event: CodePipelineEvent) => {
  const [pipeline, stage] =
    event[
      'CodePipeline.job'
    ].data.actionConfiguration.configuration.UserParameters.split('&');

  return { pipeline: pipeline as Pipeline, stage };
};

export const getJobDetailsFilename = (jobId: string) => {
  return `/tmp/${jobId}.zip`;
};

export const getJobDetails = async (event: CodePipelineEvent) => {
  const jobId = event['CodePipeline.job'].id;

  /**
   * CodePipeline grants temporary credentials to read the input artifact.
   */
  const { accessKeyId, secretAccessKey, sessionToken } =
    event['CodePipeline.job'].data.artifactCredentials;

  const s3 = new S3Client({
    credentials: { accessKeyId, secretAccessKey, sessionToken },
  });

  const { bucketName, objectKey } =
    event['CodePipeline.job'].data.inputArtifacts[0].location.s3Location;

  const { Body } = await s3.send(
    new GetObjectCommand({ Bucket: bucketName, Key: objectKey })
  );

  if (!Body) {
    throw new Error(
      'Cannot retrieve the job description (there is no input artifact).'
    );
  }

  const filename = getJobDetailsFilename(jobId);

  await fs.promises.writeFile(filename, await Body.transformToByteArray());

  const zip = new AdmZip(filename);

  const file = zip.readAsText(getUserParameters(event).pipeline);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return JSON.parse(file) as { payload: any };
  } catch {
    throw new Error(`Job details is not a valid json. ${file}`);
  }
};

const getExecuteTasksInput = ({
  pipeline,
  payload,
  pipelineName,
}: {
  pipeline: Pipeline;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  pipelineName?: string;
}) => {
  const tags = [
    {
      key: 'Pipeline',
      value: pipeline,
    },
    {
      key: 'AfterCommit',
      value: payload.after,
    },
  ];

  const taskEnvironment = [];

  if (pipelineName) {
    tags.push({
      key: 'PipelineName',
      value: pipelineName,
    });

    taskEnvironment.push({
      name: 'PIPELINE_NAME',
      value: pipelineName,
    });
  }

  if (pipeline === 'main') {
    return {
      commands: [
        shConditionalCommands({
          conditionalCommands: getMainCommands(),
        }),
      ],
      tags,
      taskEnvironment,
    };
  }

  if (pipeline === 'tag') {
    const tag = payload.ref.split('/')[2];

    return {
      commands: [
        shConditionalCommands({
          conditionalCommands: getTagCommands({ tag }),
        }),
      ],
      tags: [
        ...tags,
        {
          key: 'Tag',
          value: tag,
        },
      ],
      taskEnvironment,
    };
  }

  return undefined;
};

export const pipelinesHandler: CodePipelineHandler = async (event) => {
  const jobId = event['CodePipeline.job'].id;

  let pipelineName: string | undefined;

  try {
    const { pipeline } = getUserParameters(event);

    const gitHubJobDetails = await getJobDetails(event);

    const { jobDetails } = await codepipeline.send(
      new GetJobDetailsCommand({ jobId })
    );

    pipelineName = jobDetails?.data?.pipelineContext?.pipelineName;

    const executeTasksInput = getExecuteTasksInput({
      pipeline,
      payload: gitHubJobDetails.payload,
      pipelineName,
    });

    if (!executeTasksInput) {
      throw new Error('executeTasksInputUndefined');
    }

    await executeTasks(executeTasksInput);

    await codepipeline.send(new PutJobSuccessResultCommand({ jobId }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (pipelineName) {
      await putApprovalResultManualTask({
        pipelineName,
        /**
         * https://docs.aws.amazon.com/codepipeline/latest/APIReference/API_ApprovalResult.html
         */
        result: { status: 'Rejected', summary: error.message.slice(0, 511) },
      });
    }

    await codepipeline.send(
      new PutJobFailureResultCommand({
        jobId,
        failureDetails: {
          type: 'JobFailed',
          message: error.message.slice(0, 4999),
        },
      })
    );
  }
};
