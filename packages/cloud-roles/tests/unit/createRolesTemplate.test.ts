import { IAM_PATH, createRolesTemplate } from '../../src';

test('should add Resource and Output to template', () => {
  const AppSyncLambdaFunctionIAMRole: any = {
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      },
      ManagedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      ],
    },
  };

  const template = createRolesTemplate({
    resources: {
      AppSyncLambdaFunctionIAMRole,
    },
  });

  expect(template.Resources.AppSyncLambdaFunctionIAMRole).toMatchObject({
    ...AppSyncLambdaFunctionIAMRole,
  });

  expect(
    template.Resources.AppSyncLambdaFunctionIAMRole.Properties.Path
  ).toEqual(IAM_PATH);

  expect(template.Outputs?.AppSyncLambdaFunctionIAMRoleArn).toMatchObject({
    Value: { 'Fn::GetAtt': ['AppSyncLambdaFunctionIAMRole', 'Arn'] },
    Export: {
      Name: {
        'Fn::Join': [
          ':',
          [{ Ref: 'AWS::StackName' }, 'AppSyncLambdaFunctionIAMRoleArn'],
        ],
      },
    },
  });
});
