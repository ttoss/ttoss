import * as fs from 'fs';
import { CodePipeline, S3 } from 'aws-sdk';
import { CodePipelineEvent, CodePipelineHandler } from 'aws-lambda';
import { Pipeline, getMainCommands, getTagCommands } from '../pipelines';
import { executeTasks } from './executeTasks';
import { putApprovalResultManualTask } from './putApprovalResultManualTask';
import { shConditionalCommands } from './shConditionalCommands';
import AdmZip from 'adm-zip';

const codepipeline = new CodePipeline();

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

  const s3 = new S3({
    credentials: event['CodePipeline.job'].data.artifactCredentials,
  });

  const { bucketName, objectKey } =
    event['CodePipeline.job'].data.inputArtifacts[0].location.s3Location;

  const { Body } = await s3
    .getObject({ Bucket: bucketName, Key: objectKey })
    .promise();

  if (!Body) {
    throw new Error(
      'Cannot retrieve the job description (there is no input artifact).'
    );
  }

  const filename = getJobDetailsFilename(jobId);

  await fs.promises.writeFile(filename, Body as any, {});

  const zip = new AdmZip(filename);

  const file = zip.readAsText(getUserParameters(event).pipeline);

  try {
    return JSON.parse(file) as { payload: any };
  } catch {
    throw new Error(`Job details is not a valid json. ${file}`);
  }
};

export const pipelinesHandler: CodePipelineHandler = async (event) => {
  const jobId = event['CodePipeline.job'].id;

  let pipelineName: string | undefined;

  try {
    const { pipeline } = getUserParameters(event);

    const gitHubJobDetails = await getJobDetails(event);

    const { jobDetails } = await codepipeline
      .getJobDetails({ jobId })
      .promise();

    pipelineName = jobDetails?.data?.pipelineContext?.pipelineName;

    const executeTasksInput = (() => {
      const tags = [
        {
          key: 'Pipeline',
          value: pipeline,
        },
        {
          key: 'AfterCommit',
          value: gitHubJobDetails.payload.after,
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
        const tag = gitHubJobDetails.payload.ref.split('/')[2];

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
    })();

    if (!executeTasksInput) {
      throw new Error('executeTasksInputUndefined');
    }

    await executeTasks(executeTasksInput);

    await codepipeline.putJobSuccessResult({ jobId }).promise();
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

    await codepipeline
      .putJobFailureResult({
        jobId,
        failureDetails: {
          type: 'JobFailed',
          message: error.message.slice(0, 4999),
        },
      })
      .promise();
  }
};
