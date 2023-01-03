import type {
  CloudFormationTemplate,
  IAMRoleResource,
  Outputs,
} from '@ttoss/cloudformation';

export const IAM_PATH = '/custom-iam/';

export type { CloudFormationTemplate, IAMRoleResource, Outputs };

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
    const newKey = key + 'Arn';

    acc[newKey] = {
      Description: `Arn of the ${key} role.`,
      Value: { 'Fn::GetAtt': [key, 'Arn'] },
      Export: {
        Name: { 'Fn::Join': [':', [{ Ref: 'AWS::StackName' }, newKey]] },
      },
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
