import { type CloudFormationTemplate } from '@ttoss/cloudformation';
import deepmerge from 'deepmerge';

import { deploy } from '../cloudformation.core';
import { handleDeployError, handleDeployInitialization } from '../utils';
import { BASE_STACK_NAME } from './config';
import { getBucketTemplate } from './getBucketTemplate';
import { getCloudFrontTemplate } from './getCloudFrontTemplate';
import { getLambdaImageBuilderTemplate } from './getLambdaImageBuilderTemplate';
import { getLambdaLayerBuilderTemplate } from './getLambdaLayerBuilderTemplate';
import { getVpcTemplate } from './getVpcTemplate';

const logPrefix = 'base-stack';

export const baseStackTemplate = deepmerge.all([
  getBucketTemplate(),
  getCloudFrontTemplate(),
  getLambdaImageBuilderTemplate(),
  getLambdaLayerBuilderTemplate(),
  getVpcTemplate(),
] as CloudFormationTemplate[]) as CloudFormationTemplate;

/**
 * Base Stack is a set of auxiliary resources that will be used to help at the
 * deployment time. The resources that will be created are listed below.
 *
 * - **S3 bucket**. Deployment may need an auxiliary bucket to succeed. For
 * instance, to deploy resources that contain a
 * [Lambda](https://carlin.ttoss.dev/docs/commands/deploy#lambda), we need a S3
 * bucket to upload the zipped code. Or if the CloudFormation template has a
 * size greater than [the limit](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cloudformation-limits.html),
 * we need to upload the template to a S3 bucket in order to create/update the
 * stack.
 *
 * - **CloudFront function**. This resource is used to append the `index.html`
 * to the request URI. This is useful when deploying a [Docusaurus](https://docusaurus.io/)
 * website, for example.
 *
 * - **Lambda Layer builder**. This resource is a CodeBuild project that is
 * used to create Lambda Layers when [--lambda-externals](/docs/api-reference/deploy#lambda-externals)
 * has values.
 *
 * - **Lambda Image builder**. This resource is a CodeBuild project that builds
 * Docker Images if Lambda is going to use them.
 *
 * - **VPC**. This resource is used when some network infrastructure is
 * required. For example, CICD needs a VPC to execute the [Fargate](https://aws.amazon.com/fargate/)
 * operations.
 */
export const deployBaseStack = async () => {
  try {
    const { stackName } = await handleDeployInitialization({
      logPrefix,
      stackName: BASE_STACK_NAME,
    });

    await deploy({
      template: baseStackTemplate,
      params: { StackName: stackName },
      terminationProtection: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    handleDeployError({ error, logPrefix });
  }
};
