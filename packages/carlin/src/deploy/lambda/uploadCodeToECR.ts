import { AWS_DEFAULT_REGION } from '../../config';
import { CodeBuild } from 'aws-sdk';
import { getBaseStackResource } from '../baseStack/getBaseStackResource';
import { getPackageVersion, waitCodeBuildFinish } from '../../utils';

const codeBuild = new CodeBuild({ region: AWS_DEFAULT_REGION });

export const uploadCodeToECR = async ({
  bucket,
  key,
  lambdaExternals,
  lambdaDockerfile,
}: {
  bucket: string;
  key: string;
  versionId: string;
  lambdaDockerfile?: string;
  lambdaExternals: string[];
}) => {
  const TEMP = 1;

  if (TEMP) {
    throw new Error('uploadCodeToECR not finished yet.');
  }

  const lambdaBuilder = await getBaseStackResource(
    'BASE_STACK_LAMBDA_IMAGE_BUILDER_LOGICAL_NAME'
  );

  const defaultDockerfile = [
    'FROM public.ecr.aws/lambda/nodejs:14',
    // eslint-disable-next-line no-template-curly-in-string
    'COPY . ${LAMBDA_TASK_ROOT}',
    'RUN npm install',
  ].join('\n');

  const { build } = await codeBuild
    .startBuild({
      environmentVariablesOverride: [
        {
          name: 'DOCKERFILE',
          value: lambdaDockerfile || defaultDockerfile,
        },
        {
          name: 'LAMBDA_EXTERNALS',
          value: lambdaExternals.join(' '),
        },
        {
          name: 'IMAGE_TAG',
          value: getPackageVersion(),
        },
        {
          name: 'REPOSITORY_ECR_REPOSITORY',
          value: 'testtesteste',
        },
      ],
      projectName: lambdaBuilder,
      sourceLocationOverride: `${bucket}/${key}`,
      sourceTypeOverride: 'S3',
    })
    .promise();

  if (!build?.id) {
    throw new Error('Cannot start build.');
  }

  await waitCodeBuildFinish({ buildId: build.id, name: 'lambda-builder' });

  const imageUri =
    '178804353523.dkr.ecr.us-east-1.amazonaws.com/testtesteste:0.0.1';

  return { imageUri };
};
