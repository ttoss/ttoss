import {
  CloudFormationTemplate,
  IAMRoleResource,
  Outputs,
} from '@ttoss/cloudformation';

export const IAM_PATH = '/custom-iam/';

export const createRolesTemplate = ({
  path = IAM_PATH,
  resources,
}: {
  path?: string;
  resources: { [key: string]: IAMRoleResource };
}): CloudFormationTemplate => {
  Object.values(resources).forEach((resource) => {
    if (!resource.Properties.Path) {
      resource.Properties.Path = path;
    }
  });

  const outputs: Outputs = Object.keys(resources).reduce((acc, key) => {
    acc[key + 'Arn'] = {
      Description: `Arn of the ${key} role.`,
      Value: { 'Fn::GetAtt': [key, 'Arn'] },
      Export: { Name: { 'Fn::Join': [':', [{ Ref: 'AWS::StackName' }, key]] } },
    };

    return acc;
  }, {} as Outputs);

  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Roles template. Created by @ttoss/cloud-roles.',
    Resources: resources,
    Outputs: outputs,
  };
};
