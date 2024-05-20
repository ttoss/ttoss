import { findAndReadCloudFormationTemplate } from '../../src/findAndReadCloudFormationTemplate';
import path from 'node:path';

test.each(['Production', 'Staging'])(
  'add options to config function',
  async (environment) => {
    const templatePath = path.resolve(
      __dirname,
      '../fixtures/cloudformation.ts'
    );
    const template = await findAndReadCloudFormationTemplate({
      templatePath,
      options: { environment },
    });
    expect(template).toEqual({
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
    });
  }
);
