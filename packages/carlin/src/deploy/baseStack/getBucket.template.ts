import { CloudFormationTemplate } from '../../utils';

import {
  BASE_STACK_BUCKET_LOGICAL_NAME,
  BASE_STACK_BUCKET_NAME_EXPORTED_NAME,
  BASE_STACK_BUCKET_TEMPLATES_FOLDER,
} from './config';

export const getBucketTemplate = (): CloudFormationTemplate => {
  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: {
      [BASE_STACK_BUCKET_LOGICAL_NAME]: {
        Type: 'AWS::S3::Bucket',
        DeletionPolicy: 'Retain',
        Properties: {
          LifecycleConfiguration: {
            Rules: [
              {
                ExpirationInDays: 1,
                Prefix: BASE_STACK_BUCKET_TEMPLATES_FOLDER,
                Status: 'Enabled',
              },
              {
                NoncurrentVersionExpirationInDays: 3,
                Status: 'Enabled',
              },
            ],
          },
          /**
           * This is necessary because if we update Lambda code without change
           * CloudFormation template, the Lambda will not be updated.
           */
          VersioningConfiguration: {
            Status: 'Enabled',
          },
        },
      },
    },
    Outputs: {
      [BASE_STACK_BUCKET_LOGICAL_NAME]: {
        Value: { Ref: BASE_STACK_BUCKET_LOGICAL_NAME },
        Export: {
          Name: BASE_STACK_BUCKET_NAME_EXPORTED_NAME,
        },
      },
    },
  };
};
