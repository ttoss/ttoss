import { CloudFormation } from 'aws-sdk';
import {
  CloudFormationTemplate,
  getEnvironment,
  readCloudFormationYamlTemplate,
  readObjectFile,
} from '../utils';
import {
  canDestroyStack,
  cloudFormationV2,
  deleteStack,
  deploy,
  doesStackExist,
} from './cloudFormation.core';
import { deployLambdaCode } from './lambda/deployLambdaCode';
import { emptyS3Directory } from './s3';
import { getStackName } from './stackName';
import { handleDeployError, handleDeployInitialization } from './utils';
import fs from 'fs';
import log from 'npmlog';
import path from 'path';

const logPrefix = 'cloudformation';
log.addLevel('event', 10000, { fg: 'yellow' });
log.addLevel('output', 10000, { fg: 'blue' });

export const defaultTemplatePaths = ['ts', 'js', 'yaml', 'yml', 'json'].map(
  (extension) => `./src/cloudformation.${extension}`
);

const findAndReadCloudFormationTemplate = ({
  templatePath: defaultTemplatePath,
}: {
  templatePath?: string;
}): CloudFormationTemplate => {
  const templatePath =
    defaultTemplatePath ||
    defaultTemplatePaths
      /**
       * Iterate over extensions. If the template of the current extension is
       * found, we save it on the accumulator and return it every time until
       * the loop ends.
       */
      .reduce((acc, cur) => {
        if (acc) {
          return acc;
        }

        return fs.existsSync(path.resolve(process.cwd(), cur)) ? cur : acc;
      }, '');

  if (!templatePath) {
    throw new Error('Cannot find a CloudFormation template.');
  }

  const extension = templatePath?.split('.').pop() as string;

  const fullPath = path.resolve(process.cwd(), templatePath);

  /**
   * We need to read Yaml first because CloudFormation specific tags aren't
   * recognized when parsing a simple Yaml file. I.e., a possible error:
   * "Error message: "unknown tag !<!Ref> at line 21, column 34:\n"
   */
  if (['yaml', 'yml'].includes(extension)) {
    return readCloudFormationYamlTemplate({ templatePath });
  }

  return readObjectFile({ path: fullPath });
};

export const deployCloudFormation = async ({
  lambdaDockerfile,
  lambdaInput,
  lambdaImage,
  lambdaExternals = [],
  parameters,
  template,
  templatePath,
}: {
  lambdaDockerfile?: string;
  lambdaInput: string;
  lambdaImage?: boolean;
  lambdaExternals?: string[];
  parameters?: CloudFormation.Parameters;
  templatePath?: string;
  template?: CloudFormationTemplate;
}) => {
  try {
    const { stackName } = await handleDeployInitialization({ logPrefix });

    const cloudFormationTemplate: CloudFormationTemplate = (() => {
      if (template) {
        return { ...template };
      }

      return findAndReadCloudFormationTemplate({ templatePath });
    })();

    await cloudFormationV2()
      .validateTemplate({
        TemplateBody: JSON.stringify(cloudFormationTemplate, null, 2),
      })
      .promise();

    const params = {
      StackName: stackName,
      Parameters: parameters || [],
    };

    const deployCloudFormationDeployLambdaCode = async () => {
      const response = await deployLambdaCode({
        lambdaDockerfile,
        lambdaExternals,
        lambdaInput,
        lambdaImage,
        stackName,
      });

      if (response) {
        const { bucket, key, versionId, imageUri } = response;

        if (imageUri) {
          cloudFormationTemplate.Parameters = {
            LambdaImageUri: { Type: 'String' },
            ...cloudFormationTemplate.Parameters,
          };

          params.Parameters.push({
            ParameterKey: 'LambdaImageUri',
            ParameterValue: imageUri,
          });
        } else if (bucket && key && versionId) {
          /**
           * Add Parameters to CloudFormation template.
           */
          cloudFormationTemplate.Parameters = {
            LambdaS3Bucket: { Type: 'String' },
            LambdaS3Key: { Type: 'String' },
            LambdaS3ObjectVersion: { Type: 'String' },
            ...cloudFormationTemplate.Parameters,
          };

          /**
           * Add S3Bucket and S3Key to params.
           */
          params.Parameters.push(
            {
              ParameterKey: 'LambdaS3Bucket',
              ParameterValue: bucket,
            },
            {
              ParameterKey: 'LambdaS3Key',
              ParameterValue: key,
            },
            /**
             * Used by CloudFormation AWS::Lambda::Function
             * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-lambda-function-code.html}
             * and by CloudFormation AWS::Serverless::Function
             * @see {@link https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-property-function-functioncode.html}
             */
            {
              ParameterKey: 'LambdaS3ObjectVersion',
              ParameterValue: versionId,
            }
          );
        }
      }
    };

    await deployCloudFormationDeployLambdaCode();

    const output = await deploy({
      params,
      template: cloudFormationTemplate,
    });

    return output;
  } catch (error: any) {
    return handleDeployError({ error, logPrefix });
  }
};

const emptyStackBuckets = async ({ stackName }: { stackName: string }) => {
  const buckets: string[] = [];

  await (async function getBuckets({ nextToken }: { nextToken?: string }) {
    const { NextToken, StackResourceSummaries } = await cloudFormationV2()
      .listStackResources({ StackName: stackName, NextToken: nextToken })
      .promise();

    if (NextToken) {
      await getBuckets({ nextToken: NextToken });
    }

    (StackResourceSummaries || []).forEach(
      ({ ResourceType, PhysicalResourceId }) => {
        if (ResourceType === 'AWS::S3::Bucket' && PhysicalResourceId) {
          buckets.push(PhysicalResourceId);
        }
      }
    );
  })({});

  return Promise.all(buckets.map((bucket) => emptyS3Directory({ bucket })));
};

/**
 * 1. Check if `environment` is defined. If defined, return. It doesn't destroy
 * stacks with defined `environment`.
 * 1. Check if termination protection is disabled.
 * 1. If the stack deployed buckets, empty all buckets.
 * 1. Delete the stack.
 */
const destroy = async ({ stackName }: { stackName: string }) => {
  const environment = getEnvironment();

  if (environment) {
    log.info(
      logPrefix,
      `Cannot destroy stack when environment (${environment}) is defined.`
    );
    return;
  }

  if (!(await doesStackExist({ stackName }))) {
    log.info(logPrefix, `Stack ${stackName} doesn't exist.`);
    return;
  }

  if (!(await canDestroyStack({ stackName }))) {
    const message = `Stack ${stackName} cannot be destroyed while TerminationProtection is enabled.`;
    throw new Error(message);
  }

  await emptyStackBuckets({ stackName });

  await deleteStack({ stackName });
};

export const destroyCloudFormation = async ({
  stackName: defaultStackName,
}: {
  stackName?: string;
} = {}) => {
  try {
    log.info(logPrefix, 'CAUTION! Starting CloudFormation destroy...');
    const stackName = defaultStackName || (await getStackName());
    log.info(logPrefix, `stackName: ${stackName}`);
    await destroy({ stackName });
  } catch (error: any) {
    handleDeployError({ error, logPrefix });
  }
};
