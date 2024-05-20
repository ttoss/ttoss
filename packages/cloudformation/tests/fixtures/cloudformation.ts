import { CloudFormationTemplate } from '../../src';

// eslint-disable-next-line import/no-default-export
export default async ({ environment }: { environment: string }) => {
  const template: CloudFormationTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'A simple AWS CloudFormation template.',
    Resources: {
      MyBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: `my-bucket-${environment}`,
        },
      },
    },
  };

  return template;
};
