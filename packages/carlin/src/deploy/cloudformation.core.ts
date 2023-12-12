import * as fs from 'fs';
import * as path from 'path';
import { BASE_STACK_BUCKET_TEMPLATES_FOLDER } from './baseStack/config';
import {
  CloudFormationClient,
  CloudFormationClientConfig,
  CreateStackCommand,
  CreateStackCommandInput,
  DeleteStackCommand,
  DescribeStackEventsCommand,
  DescribeStackResourceCommand,
  DescribeStackResourceCommandInput,
  DescribeStacksCommand,
  ListStackResourcesCommand,
  UpdateStackCommand,
  UpdateStackCommandInput,
  UpdateTerminationProtectionCommand,
  ValidateTemplateCommand,
  ValidateTemplateCommandInput,
} from '@aws-sdk/client-cloudformation';
import { CloudFormationTemplate, getEnvVar, getEnvironment } from '../utils';
import { addDefaults } from './addDefaults.cloudformation';
import { emptyS3Directory, uploadFileToS3 } from './s3';
import { getBaseStackResource } from './baseStack/getBaseStackResource';
import AWS from 'aws-sdk';
import log from 'npmlog';

const logPrefix = 'cloudformation';
log.addLevel('event', 10000, { fg: 'yellow' });
log.addLevel('output', 10000, { fg: 'blue' });

/**
 * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cloudformation-limits.html
 */
const TEMPLATE_BODY_MAX_SIZE = 51200;

const isTemplateBodyGreaterThanMaxSize = (
  template: CloudFormationTemplate
): boolean => {
  return (
    Buffer.byteLength(JSON.stringify(template), 'utf8') >=
    TEMPLATE_BODY_MAX_SIZE
  );
};

/**
 * Update CloudFormation template to base stack bucket.
 * @param input.stackName: CloudFormation stack name.
 * @param input.template: CloudFormation template.
 */
const uploadTemplateToBaseStackBucket = async ({
  stackName,
  template,
}: {
  stackName: string;
  template: CloudFormationTemplate;
}) => {
  const bucketName = await getBaseStackResource(
    'BASE_STACK_BUCKET_LOGICAL_NAME'
  );

  const { url } = await uploadFileToS3({
    bucket: bucketName,
    contentType: 'application/json',
    key: `${BASE_STACK_BUCKET_TEMPLATES_FOLDER}/${stackName}.json`,
    file: Buffer.from(JSON.stringify(template, null, 2)),
  });

  return { url };
};

/**
 * CloudFormation client cache to avoid creating multiple clients.
 * Each client is created with different parameters.
 */
const cloudFormationClients: { [key: string]: CloudFormationClient } = {};

export const cloudformation = () => {
  const cloudFormationClientConfig: CloudFormationClientConfig = {
    apiVersion: '2010-05-15',
    region: getEnvVar('REGION'),
  };

  const key = JSON.stringify(cloudFormationClientConfig);

  if (!cloudFormationClients[key]) {
    cloudFormationClients[key] = new CloudFormationClient({
      apiVersion: '2010-05-15',
      region: getEnvVar('REGION'),
    });
  }

  return cloudFormationClients[key];
};

export const cloudFormationV2 = () => {
  return new AWS.CloudFormation({ apiVersion: '2010-05-15' });
};

export const describeStacks = async ({
  stackName,
}: { stackName?: string } = {}) => {
  const { Stacks } = await cloudformation().send(
    new DescribeStacksCommand({ StackName: stackName })
  );
  return Stacks;
};

export const describeStackResource = async (
  input: DescribeStackResourceCommandInput
) => {
  return cloudformation().send(new DescribeStackResourceCommand(input));
};

export const doesStackExist = async ({ stackName }: { stackName: string }) => {
  log.info(logPrefix, `Checking if stack ${stackName} already exists...`);

  try {
    await describeStacks({ stackName });
    log.info(logPrefix, `Stack ${stackName} already exists.`);
    return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.Code === 'ValidationError') {
      log.info(logPrefix, `Stack ${stackName} does not exist.`);
      return false;
    }
    throw error;
  }
};

export const describeStackEvents = async ({
  stackName,
}: {
  stackName: string;
}) => {
  log.error(logPrefix, 'Stack events:');

  const { StackEvents } = await cloudformation().send(
    new DescribeStackEventsCommand({ StackName: stackName })
  );

  const events = (StackEvents || [])
    .filter(({ Timestamp }) => {
      return Date.now() - Number(Timestamp) < 10 * 60 * 1000;
    })
    .filter(({ ResourceStatusReason }) => {
      return ResourceStatusReason;
    })
    /**
     * Show newer events last.
     */
    .reverse();

  events.forEach(({ LogicalResourceId, ResourceStatusReason }) => {
    return log.event(LogicalResourceId, ResourceStatusReason);
  });

  return events;
};

export const describeStack = async ({ stackName }: { stackName: string }) => {
  const stacks = await describeStacks({ stackName });

  if (!stacks) {
    throw new Error(`Stack ${stackName} not found and cannot be described.`);
  }

  return stacks[0];
};

export const getStackOutput = async ({
  stackName,
  outputKey,
}: {
  stackName: string;
  outputKey: string;
}) => {
  const { Outputs = [] } = await describeStack({ stackName });

  const output = Outputs?.find(({ OutputKey }) => {
    return OutputKey === outputKey;
  });

  if (!output) {
    throw new Error(`Output ${outputKey} doesn't exist on ${stackName} stack`);
  }

  return output;
};

const saveEnvironmentOutput = async ({
  outputs,
  stackName,
}: {
  outputs: AWS.CloudFormation.Output[];
  stackName: string;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const envFile: any = { stackName };

  envFile.outputs = outputs.reduce((acc, output) => {
    if (!output.OutputKey || !output) {
      return acc;
    }

    return {
      ...acc,
      [output.OutputKey]: output,
    };
  }, {});

  const dotCarlinFolderPath = path.join(process.cwd(), '.carlin');

  if (!fs.existsSync(dotCarlinFolderPath)) {
    await fs.promises.mkdir(dotCarlinFolderPath);
  }

  const filePath = path.join(dotCarlinFolderPath, `${stackName}.json`);

  await fs.promises.writeFile(filePath, JSON.stringify(envFile, null, 2));
};

export const printStackOutputsAfterDeploy = async ({
  stackName,
}: {
  stackName: string;
}) => {
  const {
    EnableTerminationProtection,
    StackName,
    Outputs = [],
  } = await describeStack({ stackName });

  await saveEnvironmentOutput({ stackName, outputs: Outputs });

  log.output('Describe Stack');
  log.output('StackName', StackName);
  log.output('EnableTerminationProtection', EnableTerminationProtection);
  Outputs.forEach(({ OutputKey, OutputValue, Description, ExportName }) => {
    log.output(
      `${OutputKey}`,
      [
        '',
        `OutputKey: ${OutputKey}`,
        `OutputValue: ${OutputValue}`,
        `Description: ${Description}`,
        `ExportName: ${ExportName}`,
        '',
      ].join('\n')
    );
  });
};

export const deleteStack = async ({ stackName }: { stackName: string }) => {
  log.info(logPrefix, `Deleting stack ${stackName}...`);
  await cloudformation().send(new DeleteStackCommand({ StackName: stackName }));
  try {
    await cloudFormationV2()
      .waitFor('stackDeleteComplete', { StackName: stackName })
      .promise();
  } catch (err) {
    log.error(logPrefix, `An error occurred when deleting stack ${stackName}.`);
    await describeStackEvents({ stackName });
    throw err;
  }
  log.info(logPrefix, `Stack ${stackName} deleted.`);
};

export const createStack = async ({
  params,
}: {
  params: CreateStackCommandInput;
}) => {
  const { StackName: stackName = '' } = params;
  log.info(logPrefix, `Creating stack ${stackName}...`);
  await cloudformation().send(new CreateStackCommand(params));
  try {
    await cloudFormationV2()
      .waitFor('stackCreateComplete', { StackName: stackName })
      .promise();
  } catch (err) {
    log.error(logPrefix, `An error occurred when creating stack ${stackName}.`);
    await describeStackEvents({ stackName });
    await deleteStack({ stackName });
    throw err;
  }
  log.info(logPrefix, `Stack ${stackName} was created.`);
};

export const updateStack = async ({
  params,
}: {
  params: UpdateStackCommandInput;
}) => {
  const { StackName: stackName = '' } = params;
  log.info(logPrefix, `Updating stack ${stackName}...`);
  try {
    await cloudformation().send(new UpdateStackCommand(params));
    await cloudFormationV2()
      .waitFor('stackUpdateComplete', { StackName: stackName })
      .promise();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.message === 'No updates are to be performed.') {
      log.info(logPrefix, error.message);
      return;
    }
    log.error(logPrefix, 'An error occurred when updating stack.');
    await describeStackEvents({ stackName });
    throw error;
  }
  log.info(logPrefix, `Stack ${stackName} was updated.`);
};

export const enableTerminationProtection = async ({
  stackName,
}: {
  stackName: string;
}) => {
  log.info(logPrefix, `Enabling termination protection...`);

  try {
    await cloudformation().send(
      new UpdateTerminationProtectionCommand({
        EnableTerminationProtection: true,
        StackName: stackName,
      })
    );
  } catch (err) {
    log.error(
      logPrefix,
      'An error occurred when enabling termination protection'
    );
    throw err;
  }
};

export const defaultTemplatePaths = ['ts', 'js', 'yaml', 'yml', 'json'].map(
  (extension) => {
    return `src/cloudformation.${extension}`;
  }
);

/**
 * 1. Add defaults to CloudFormation template and parameters.
 * 1. Check is CloudFormation template body is greater than max size limit.
 *  1. If is greater, upload to S3 base stack.
 * 1. If stack exists, update the stack, else create a new stack.
 * 1. If `terminationProtection` option is true or `environment` is defined,
 * then stack termination protection will be enabled.
 */
export const deploy = async ({
  terminationProtection = false,
  ...paramsAndTemplate
}: {
  terminationProtection?: boolean;
  params: CreateStackCommandInput | UpdateStackCommandInput;
  template: CloudFormationTemplate;
}) => {
  const { params, template } = await addDefaults(paramsAndTemplate);

  const stackName = params.StackName;

  if (!stackName) {
    throw new Error('StackName is required');
  }

  delete params.TemplateBody;
  delete params.TemplateURL;

  if (isTemplateBodyGreaterThanMaxSize(template)) {
    const { url } = await uploadTemplateToBaseStackBucket({
      stackName,
      template,
    });

    params.TemplateURL = url;
  } else {
    params.TemplateBody = JSON.stringify(template);
  }

  /**
   * CAPABILITY_AUTO_EXPAND allows serverless transform.
   */
  params.Capabilities = [
    'CAPABILITY_AUTO_EXPAND',
    'CAPABILITY_IAM',
    'CAPABILITY_NAMED_IAM',
  ];

  if (await doesStackExist({ stackName })) {
    await updateStack({ params });
  } else {
    await createStack({ params });
  }

  if (terminationProtection || !!getEnvironment()) {
    await enableTerminationProtection({ stackName });
  }

  await printStackOutputsAfterDeploy({ stackName });

  return describeStack({ stackName });
};

export const canDestroyStack = async ({ stackName }: { stackName: string }) => {
  const { EnableTerminationProtection } = await describeStack({ stackName });

  if (EnableTerminationProtection) {
    return false;
  }

  return true;
};

const emptyStackBuckets = async ({ stackName }: { stackName: string }) => {
  const buckets: string[] = [];

  await (async ({ nextToken }: { nextToken?: string }) => {
    const { NextToken, StackResourceSummaries } = await cloudformation().send(
      new ListStackResourcesCommand({
        StackName: stackName,
        NextToken: nextToken,
      })
    );

    if (NextToken) {
      // await getBuckets({ nextToken: NextToken });
    }

    (StackResourceSummaries || []).forEach(
      ({ ResourceType, PhysicalResourceId }) => {
        if (ResourceType === 'AWS::S3::Bucket' && PhysicalResourceId) {
          buckets.push(PhysicalResourceId);
        }
      }
    );
  })({});

  return Promise.all(
    buckets.map((bucket) => {
      return emptyS3Directory({ bucket });
    })
  );
};

/**
 * 1. Check if `environment` is defined. If defined, return. It doesn't destroy
 * stacks with defined `environment`.
 * 1. Check if termination protection is disabled.
 * 1. If the stack deployed buckets, empty all buckets.
 * 1. Delete the stack.
 */
export const destroy = async ({ stackName }: { stackName: string }) => {
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

export const validateTemplate = async ({
  stackName,
  template,
}: {
  stackName: string;
  template: CloudFormationTemplate;
}) => {
  const validateTemplateCommandInput: ValidateTemplateCommandInput = {};

  if (isTemplateBodyGreaterThanMaxSize(template)) {
    const { url } = await uploadTemplateToBaseStackBucket({
      stackName,
      template,
    });

    validateTemplateCommandInput.TemplateURL = url;
  } else {
    validateTemplateCommandInput.TemplateBody = JSON.stringify(template);
  }

  await cloudformation().send(
    new ValidateTemplateCommand(validateTemplateCommandInput)
  );
};
