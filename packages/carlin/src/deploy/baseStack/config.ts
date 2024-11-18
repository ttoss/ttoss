import { NAME } from '../../config';
import { pascalCase } from 'change-case';

const pascalCaseName = pascalCase(NAME);

export const BASE_STACK_NAME = `${pascalCaseName}BaseStack`;
export const BASE_STACK_BUCKET_TEMPLATES_FOLDER = 'cloudformation-templates';

/**
 * S3 Bucket.
 */
export const BASE_STACK_BUCKET_LOGICAL_NAME = `${pascalCaseName}Bucket`;

export const BASE_STACK_BUCKET_NAME_EXPORTED_NAME = `${pascalCaseName}BucketNameExportedName`;

/**
 * CloudFront.
 */
export const BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_LOGICAL_NAME = `${pascalCaseName}CloudFrontFunctionAppendIndexHtml`;

export const BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_ARN = `${pascalCaseName}CloudFrontFunctionAppendIndexHtmlArn`;

export const BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_ARN_EXPORTED_NAME = `${pascalCaseName}CloudFrontFunctionAppendIndexHtmlArnExportedName`;

/**
 * Lambda image builder.
 */
export const BASE_STACK_LAMBDA_IMAGE_BUILDER_LOGICAL_NAME = `${pascalCaseName}LambdaImageBuilder`;

export const BASE_STACK_LAMBDA_IMAGE_BUILDER_EXPORTED_NAME = `${pascalCaseName}LambdaImageBuilderExportedName`;

/**
 * Lambda layer builder.
 */
export const BASE_STACK_LAMBDA_LAYER_BUILDER_LOGICAL_NAME = `${pascalCaseName}LambdaLayerBuilder`;

/**
 * VPC
 */
export const BASE_STACK_VPC_ID_EXPORTED_NAME = `${pascalCaseName}VPCIDExportedName`;

export const BASE_STACK_VPC_DEFAULT_SECURITY_GROUP_EXPORTED_NAME = `${pascalCaseName}DefaultSecurityGroupExportedName`;

export const BASE_STACK_VPC_PUBLIC_SUBNET_0_EXPORTED_NAME = `${pascalCaseName}VPCPublicSubnet0ExportedName`;

export const BASE_STACK_VPC_PUBLIC_SUBNET_1_EXPORTED_NAME = `${pascalCaseName}VPCPublicSubnet1ExportedName`;

export const BASE_STACK_VPC_PUBLIC_SUBNET_2_EXPORTED_NAME = `${pascalCaseName}VPCPublicSubnet2ExportedName`;
