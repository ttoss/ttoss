import {
  type CloudFormationTemplate,
  findAndReadCloudFormationTemplate,
} from '@ttoss/cloudformation';
import type AWS from 'aws-sdk';
import log from 'npmlog';

import { getEnvironment, getPackageName, getProjectName } from '../utils';
import {
  canDestroyStack,
  cloudFormationV2,
  deleteStack,
  deploy,
  doesStackExist,
  validateTemplate,
} from './cloudformation.core';
import { addSourceMapsNodeOptions } from './lambda/addSourceMapsNodeOptions';
import { deployLambdaCode } from './lambda/deployLambdaCode';
import { getLambdaEntryPointsFromTemplate } from './lambda/getLambdaEntryPointsFromTemplate';
import { emptyS3Directory } from './s3';
import { getStackName } from './stackName';
import { handleDeployError, handleDeployInitialization } from './utils';

const logPrefix = 'cloudformation';
log.addLevel('event', 10000, { fg: 'yellow' });
log.addLevel('output', 10000, { fg: 'blue' });

export const defaultTemplatePaths = ['ts', 'js', 'yaml', 'yml', 'json'].map(
  (extension) => {
    return `./src/cloudformation.${extension}`;
  }
);

/**
 * When you use a method to generate your CloudFormation template, you can
 * retrieve the options from the CLI plus the following variables after CLI
 * validations and middlewares logic:
 *
 * - `stackName`
 * - `environment`
 * - `packageName`
 * - `projectName`
 *
 * For example, in your `cloudformation.ts` file:
 *
 * ```typescript
 * export default async ({ environment, region, stackName }) => {
 *  // Do something with CLI options and the variables above.
 * }
 * ```
 */
const getCloudformationTemplateOptions = ({
  cliOptions,
  stackName,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cliOptions: any;
  stackName: string;
}) => {
  const options = {
    ...cliOptions,
    stackName,
    environment: getEnvironment(),
    packageName: getPackageName(),
    projectName: getProjectName(),
  };

  return options;
};

type CloudFormationParameter = {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  usePreviousValue?: true | false;
  resolvedValue?: string;
};

type DeployParams = {
  StackName: string;
  Parameters: AWS.CloudFormation.Parameter[];
};

type DeployCloudFormationOptions = {
  lambdaDockerfile?: string;
  lambdaEntryPoints?: string[];
  lambdaEntryPointsBaseDir?: string;
  lambdaImage?: boolean;
  lambdaExternal?: string[];
  lambdaFormat?: 'esm' | 'cjs';
  lambdaOutdir?: string;
  lambdaSourcemap?: boolean;
  parameters?: CloudFormationParameter[];
  templatePath?: string;
  template?: CloudFormationTemplate;
};

const getParameterType = (parameter: CloudFormationParameter) => {
  if (typeof parameter.value === 'string') {
    return 'String';
  }

  if (typeof parameter.value === 'number') {
    return 'Number';
  }

  throw new Error(
    `Parameter assertion failed. Parameter ${parameter.key} value ${parameter.value} is not mapped.`
  );
};

/**
 * Add Parameters passed on CLI to CloudFormation template if they don't exist.
 * Also, automatically add the Type of the parameter.
 */
const addCliParametersToTemplate = ({
  template,
  parameters = [],
}: {
  template: CloudFormationTemplate;
  parameters?: CloudFormationParameter[];
}) => {
  for (const parameter of parameters) {
    if (template.Parameters?.[parameter.key]) {
      continue;
    }

    template.Parameters = {
      ...template.Parameters,
      [parameter.key]: { Type: getParameterType(parameter) },
    };
  }
};

/**
 * Add `Code` property to every AWS::Lambda::Function resource or `CodeUri`
 * property to every AWS::Serverless::Function resource if they are NOT
 * already defined.
 */
const addLambdaCodeToResources = (template: CloudFormationTemplate) => {
  for (const resource of Object.values(template.Resources)) {
    if (
      resource.Type === 'AWS::Lambda::Function' &&
      !resource.Properties?.Code
    ) {
      resource.Properties = {
        ...resource.Properties,
        Code: {
          S3Bucket: { Ref: 'LambdaS3Bucket' },
          S3Key: { Ref: 'LambdaS3Key' },
          S3ObjectVersion: { Ref: 'LambdaS3ObjectVersion' },
        },
      };
    }

    if (
      resource.Type === 'AWS::Serverless::Function' &&
      !resource.Properties?.CodeUri
    ) {
      resource.Properties = {
        ...resource.Properties,
        CodeUri: {
          Bucket: { Ref: 'LambdaS3Bucket' },
          Key: { Ref: 'LambdaS3Key' },
          Version: { Ref: 'LambdaS3ObjectVersion' },
        },
      };
    }
  }
};

const addLambdaS3Parameters = ({
  template,
  params,
  bucket,
  key,
  versionId,
}: {
  template: CloudFormationTemplate;
  params: DeployParams;
  bucket: string;
  key: string;
  versionId: string;
}) => {
  template.Parameters = {
    LambdaS3Bucket: { Type: 'String' },
    LambdaS3Key: { Type: 'String' },
    LambdaS3ObjectVersion: { Type: 'String' },
    ...template.Parameters,
  };

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

  addLambdaCodeToResources(template);
};

const deployCloudFormationLambdaCode = async ({
  template,
  params,
  stackName,
  cliOptions,
}: {
  template: CloudFormationTemplate;
  params: DeployParams;
  stackName: string;
  cliOptions: DeployCloudFormationOptions;
}) => {
  const { lambdaEntryPoints, lambdaSourcemap } = cliOptions;

  const finalLambdaEntryPoints =
    lambdaEntryPoints && lambdaEntryPoints.length > 0
      ? lambdaEntryPoints
      : getLambdaEntryPointsFromTemplate(template);

  const response = await deployLambdaCode({
    lambdaDockerfile: cliOptions.lambdaDockerfile,
    lambdaExternal: cliOptions.lambdaExternal,
    lambdaEntryPoints: finalLambdaEntryPoints,
    lambdaEntryPointsBaseDir: cliOptions.lambdaEntryPointsBaseDir,
    lambdaFormat: cliOptions.lambdaFormat,
    lambdaImage: cliOptions.lambdaImage,
    lambdaOutdir: cliOptions.lambdaOutdir,
    lambdaSourcemap,
    stackName,
  });

  if (lambdaSourcemap && finalLambdaEntryPoints.length > 0) {
    addSourceMapsNodeOptions(template);
  }

  if (!response) {
    return;
  }

  const { bucket, key, versionId, imageUri } = response;

  if (imageUri) {
    template.Parameters = {
      LambdaImageUri: { Type: 'String' },
      ...template.Parameters,
    };

    params.Parameters.push({
      ParameterKey: 'LambdaImageUri',
      ParameterValue: imageUri,
    });
  } else if (bucket && key && versionId) {
    addLambdaS3Parameters({ template, params, bucket, key, versionId });
  }
};

export const deployCloudFormation = async (
  cliOptions: DeployCloudFormationOptions
) => {
  try {
    const { parameters, template, templatePath } = cliOptions;

    const { stackName } = await handleDeployInitialization({ logPrefix });

    const cloudFormationTemplate: CloudFormationTemplate = template
      ? { ...template }
      : await findAndReadCloudFormationTemplate({
          templatePath,
          options: getCloudformationTemplateOptions({ stackName, cliOptions }),
        });

    addCliParametersToTemplate({
      template: cloudFormationTemplate,
      parameters,
    });

    await validateTemplate({ stackName, template: cloudFormationTemplate });

    const params: DeployParams = {
      StackName: stackName,
      Parameters:
        parameters?.map<AWS.CloudFormation.Parameter>((parameter) => {
          return {
            ParameterKey: parameter.key,
            ParameterValue: parameter.value,
            UsePreviousValue: parameter.usePreviousValue,
            ResolvedValue: parameter.resolvedValue,
          };
        }) || [],
    };

    await deployCloudFormationLambdaCode({
      template: cloudFormationTemplate,
      params,
      stackName,
      cliOptions,
    });

    const output = await deploy({
      params,
      template: cloudFormationTemplate,
    });

    return output;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return handleDeployError({ error, logPrefix });
  }
};

const emptyStackBuckets = async ({ stackName }: { stackName: string }) => {
  const buckets: string[] = [];

  await (async ({ nextToken }: { nextToken?: string }) => {
    const {
      // NextToken,
      StackResourceSummaries,
    } = await cloudFormationV2()
      .listStackResources({ StackName: stackName, NextToken: nextToken })
      .promise();

    // if (NextToken) {
    //   await getBuckets({ nextToken: NextToken });
    // }

    for (const { ResourceType, PhysicalResourceId } of StackResourceSummaries ||
      []) {
      if (ResourceType === 'AWS::S3::Bucket' && PhysicalResourceId) {
        buckets.push(PhysicalResourceId);
      }
    }
  })({});

  return Promise.all(
    buckets.map((bucket) => {
      return emptyS3Directory({ bucket });
    })
  );
};

/**
 * 1. Check if `environment` is defined. If defined, do nothing. It doesn't
 * destroy stacks with defined `environment`.
 * 1. Check if termination protection is disabled.
 * 1. Empty all buckets in the stack (if any).
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

  try {
    await emptyStackBuckets({ stackName });
  } catch (error) {
    log.warn(
      logPrefix,
      `Failed to empty buckets for stack ${stackName}: ${(error as Error)?.message || error}. Proceeding with stack deletion.`
    );
  }

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    handleDeployError({ error, logPrefix });
  }
};
