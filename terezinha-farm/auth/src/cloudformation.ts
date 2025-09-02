import { createAuthTemplate } from '@ttoss/cloud-auth';

export default () => {
  const template = createAuthTemplate({
    lambdaTriggers: {
      postConfirmation: {
        'Fn::GetAtt': ['PostConfirmationLambdaFunction', 'Arn'],
      },
    },
  });

  template.Parameters = {
    ...template.Parameters,
    LambdaS3Bucket: { Type: 'String' },
    LambdaS3Key: { Type: 'String' },
    LambdaS3ObjectVersion: { Type: 'String' },
  };

  template.Resources = {
    ...template.Resources,
    PostConfirmationLambdaFunction: {
      Type: 'AWS::Lambda::Function',
      Properties: {
        Handler: 'triggers.postConfirmation',
        Code: {
          S3Bucket: { Ref: 'LambdaS3Bucket' },
          S3Key: { Ref: 'LambdaS3Key' },
          S3ObjectVersion: { Ref: 'LambdaS3ObjectVersion' },
        },
        Role: 'arn:aws:iam::483684946879:role/custom-iam/TerezinhaFarmIam-Producti-CognitoTriggersLambdaFunc-xXhqccloisep',
        Runtime: 'nodejs22.x',
      },
    },
  };

  return template;
};
