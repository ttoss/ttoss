jest.mock('src/deploy/cloudformation.core');

import {
  BASE_STACK_BUCKET_LOGICAL_NAME,
  BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_ARN,
  BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_LOGICAL_NAME,
  BASE_STACK_LAMBDA_IMAGE_BUILDER_LOGICAL_NAME,
  BASE_STACK_LAMBDA_LAYER_BUILDER_LOGICAL_NAME,
  BASE_STACK_NAME,
} from 'src/deploy/baseStack/config';
import { deploy } from 'src/deploy/cloudformation.core';
import { deployBaseStack } from 'src/deploy/baseStack/deployBaseStack';

test('should create base resources', async () => {
  await deployBaseStack();

  expect(deploy).toHaveBeenCalledWith({
    template: expect.objectContaining({
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: expect.objectContaining({
        [BASE_STACK_BUCKET_LOGICAL_NAME]: expect.anything(),
        [BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_LOGICAL_NAME]:
          expect.anything(),
        [BASE_STACK_LAMBDA_IMAGE_BUILDER_LOGICAL_NAME]: expect.anything(),
        [BASE_STACK_LAMBDA_LAYER_BUILDER_LOGICAL_NAME]: expect.anything(),
      }),
      Outputs: expect.objectContaining({
        [BASE_STACK_BUCKET_LOGICAL_NAME]: expect.anything(),
        [BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_ARN]:
          expect.anything(),
        [BASE_STACK_LAMBDA_IMAGE_BUILDER_LOGICAL_NAME]: expect.anything(),
        [BASE_STACK_LAMBDA_LAYER_BUILDER_LOGICAL_NAME]: expect.anything(),
      }),
    }),
    params: { StackName: BASE_STACK_NAME },
    terminationProtection: true,
  });
});
