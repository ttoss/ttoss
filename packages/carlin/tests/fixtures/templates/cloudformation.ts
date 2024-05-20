import { type CloudFormationTemplate } from '@ttoss/cloudformation';

export const generateTemplate = ({
  stackName,
  templatePath,
}: {
  stackName: string;
  templatePath: string;
}): CloudFormationTemplate => {
  const template: CloudFormationTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: `A simple AWS CloudFormation template from ${templatePath}`,
    Resources: {
      MyBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: `my-bucket-${stackName}`,
        },
      },
    },
  };

  return template;
};

// eslint-disable-next-line import/no-default-export
export default async ({
  stackName,
  templatePath,
}: {
  stackName: string;
  templatePath: string;
}) => {
  return generateTemplate({ stackName, templatePath });
};
