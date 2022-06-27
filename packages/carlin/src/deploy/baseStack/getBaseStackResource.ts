import { getStackOutput } from '../cloudFormation.core';

import {
  BASE_STACK_BUCKET_LOGICAL_NAME,
  BASE_STACK_LAMBDA_IMAGE_BUILDER_LOGICAL_NAME,
  BASE_STACK_LAMBDA_LAYER_BUILDER_LOGICAL_NAME,
  BASE_STACK_NAME,
} from './config';

export const getBaseStackOutput = async (outputKey: string) => {
  const output = await getStackOutput({
    stackName: BASE_STACK_NAME,
    outputKey,
  });

  return output.OutputValue;
};

const resourcesKeys = {
  BASE_STACK_BUCKET_LOGICAL_NAME,
  BASE_STACK_LAMBDA_IMAGE_BUILDER_LOGICAL_NAME,
  BASE_STACK_LAMBDA_LAYER_BUILDER_LOGICAL_NAME,
};

const resources: any = {};

export const getBaseStackResource = async (
  resource: keyof typeof resourcesKeys,
): Promise<string> => {
  if (!resources[resource]) {
    resources[resource] = await getBaseStackOutput(resourcesKeys[resource]);
  }

  return resources[resource];
};
