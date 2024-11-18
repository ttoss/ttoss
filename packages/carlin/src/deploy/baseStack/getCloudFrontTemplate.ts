import {
  BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_EXPORTED_NAME,
  BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_LOGICAL_NAME,
} from './config';
import { CloudFormationTemplate } from '../../utils';

/**
 * https://juffalow.com/blog/other/how-to-deploy-docusaurus-page-using-aws-s3-and-cloudfront#cloudfront-functions
 */
const functionCode = `function handler(event) {
  var request = event.request;
  var uri = request.uri;
  if (uri.endsWith('/')) {
    request.uri += 'index.html';
  } else if (!uri.includes('.')) {
    request.uri += '/index.html';
  }
  return request;
}`;

export const getCloudFrontTemplate = (): CloudFormationTemplate => {
  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: {
      [BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_LOGICAL_NAME]: {
        Type: 'AWS::CloudFront::Function',
        Properties: {
          Name: 'AppendIndexDotHtml',
          FunctionConfig: {
            Comment: 'Append index.html to the request URI',
            Runtime: 'cloudfront-js-2.0',
          },
          FunctionCode: functionCode,
          AutoPublish: true,
        },
      },
    },
    Outputs: {
      [BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_LOGICAL_NAME]: {
        Value: {
          Ref: BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_LOGICAL_NAME,
        },
        Export: {
          Name: BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_EXPORTED_NAME,
        },
      },
    },
  };
};
