import { CloudFormationTemplate, waitCodeBuildFinish } from '../../utils';
import { CodeBuild } from 'aws-sdk';
import { NAME, NODE_RUNTIME } from '../../config';
import { deploy, doesStackExist } from '../cloudFormation.core';
import { getBaseStackResource } from '../baseStack/getBaseStackResource';
import { handleDeployError } from '../utils';
import { pascalCase } from 'change-case';
import log from 'npmlog';

const logPrefix = 'lambda-layer';

const createLambdaLayerZipFile = async ({
  codeBuildProjectName,
  packageName,
}: {
  codeBuildProjectName: string;
  packageName: string;
}) => {
  log.info(logPrefix, `Creating zip file for package ${packageName}...`);

  const codeBuild = new CodeBuild();

  const { build } = await codeBuild
    .startBuild({
      environmentVariablesOverride: [
        {
          name: 'PACKAGE_NAME',
          value: packageName,
        },
      ],
      projectName: codeBuildProjectName,
    })
    .promise();

  if (!build?.id) {
    throw new Error('Cannot start build.');
  }

  const result = await waitCodeBuildFinish({
    buildId: build.id,
    name: packageName,
  });

  if (result.artifacts?.location) {
    const location = result.artifacts.location.split('/');

    const bucket = location.shift()?.replace('arn:aws:s3:::', '');

    if (!bucket) {
      throw new Error('Cannot retrieve bucket name.');
    }

    const key = location.join('/');
    return { bucket, key };
  }

  throw new Error(`Cannot get artifact location for package ${packageName}`);
};

/**
 * The CloudFormation template created to deploy a Lambda Layer.
 *
 * - The Layer name is the same as the Stack name.
 */
export const getLambdaLayerTemplate = ({
  bucket,
  key,
  packageName,
}: {
  bucket: string;
  key: string;
  packageName: string;
}): CloudFormationTemplate => {
  const description = packageName
    /**
     * Description has limit of 256.
     * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-layerversion.html#cfn-lambda-layerversion-description
     */
    .substring(0, 256);

  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: {
      LambdaLayer: {
        Type: 'AWS::Lambda::LayerVersion',
        Properties: {
          CompatibleRuntimes: [NODE_RUNTIME],
          Content: {
            S3Bucket: bucket,
            S3Key: key,
          },
          Description: description,
          LayerName: { Ref: 'AWS::StackName' },
        },
      },
    },
    Outputs: {
      LambdaLayerVersion: {
        Description: description,
        Value: { Ref: 'LambdaLayer' },
        Export: {
          Name: { Ref: 'AWS::StackName' },
        },
      },
    },
  };
};

export const lambdaLayerStackNamePrefix = `LambdaLayer`;

export const getPackageLambdaLayerStackName = (packageName: string) => {
  const [scopedName, version] = packageName.split('@').filter((part) => {
    return part !== '';
  });

  return [
    lambdaLayerStackNamePrefix,
    pascalCase(scopedName),
    version.replace(/\./g, '-'),
  ].join('-');
};

const getPackagesThatAreNotDeployed = async ({
  packages,
}: {
  packages: string[];
}) => {
  return (
    await Promise.all(
      packages.map(async (packageName) => {
        const stackName = getPackageLambdaLayerStackName(packageName);
        return (await doesStackExist({ stackName })) ? '' : packageName;
      })
    )
  ).filter((packageName) => {
    return !!packageName;
  });
};

export const deployLambdaLayer = async ({
  packages,
  deployIfExists = true,
}: {
  deployIfExists: boolean;
  packages: string[];
}) => {
  try {
    const packagesToBeDeployed = deployIfExists
      ? packages
      : await getPackagesThatAreNotDeployed({ packages });

    if (packagesToBeDeployed.length === 0) {
      return;
    }

    const codeBuildProjectName = await getBaseStackResource(
      'BASE_STACK_LAMBDA_LAYER_BUILDER_LOGICAL_NAME'
    );

    if (!codeBuildProjectName) {
      throw new Error(
        "Cannot deploy lambda-layer because AWS CodeBuild project doesn't exist."
      );
    }

    const deployLambdaLayerSinglePackage = async (packageName: string) => {
      try {
        const { bucket, key } = await createLambdaLayerZipFile({
          codeBuildProjectName,
          packageName,
        });

        const lambdaLayerTemplate = getLambdaLayerTemplate({
          packageName,
          bucket,
          key,
        });

        await deploy({
          template: lambdaLayerTemplate,
          terminationProtection: true,
          params: { StackName: getPackageLambdaLayerStackName(packageName) },
        });
      } catch (error: any) {
        handleDeployError({ error, logPrefix });
      }
    };

    await Promise.all(
      packagesToBeDeployed.map((packageName) => {
        return deployLambdaLayerSinglePackage(packageName);
      })
    );
  } catch (error: any) {
    handleDeployError({ error, logPrefix });
  }
};
