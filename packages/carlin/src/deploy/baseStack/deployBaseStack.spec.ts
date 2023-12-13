jest.mock('../cloudformation.core');

import {
  BASE_STACK_BUCKET_LOGICAL_NAME,
  BASE_STACK_LAMBDA_IMAGE_BUILDER_LOGICAL_NAME,
  BASE_STACK_LAMBDA_LAYER_BUILDER_LOGICAL_NAME,
  BASE_STACK_NAME,
} from './config';
import { deploy } from '../cloudformation.core';
import { deployBaseStack } from './deployBaseStack';

test('should create base resources', async () => {
  await deployBaseStack();

  expect(deploy).toHaveBeenCalledWith({
    template: expect.objectContaining({
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: expect.objectContaining({
        [BASE_STACK_BUCKET_LOGICAL_NAME]: expect.anything(),
        [BASE_STACK_LAMBDA_IMAGE_BUILDER_LOGICAL_NAME]: expect.anything(),
        [BASE_STACK_LAMBDA_LAYER_BUILDER_LOGICAL_NAME]: expect.anything(),
      }),
      Outputs: expect.objectContaining({
        [BASE_STACK_BUCKET_LOGICAL_NAME]: expect.anything(),
        [BASE_STACK_LAMBDA_IMAGE_BUILDER_LOGICAL_NAME]: expect.anything(),
        [BASE_STACK_LAMBDA_LAYER_BUILDER_LOGICAL_NAME]: expect.anything(),
      }),
    }),
    params: { StackName: BASE_STACK_NAME },
    terminationProtection: true,
  });
});
