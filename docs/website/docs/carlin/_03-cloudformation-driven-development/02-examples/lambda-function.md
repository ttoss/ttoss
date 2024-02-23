---
title: Lambda Function
---

```yaml title="cloudformation.yml"
AWSTemplateFormatVersion: 2010-09-09

Parameters:
  LambdaS3Bucket:
    Type: String

  LambdaS3Key:
    Type: String

  LambdaS3ObjectVersion:
    Type: String

Resources:
  LambdaFunctionResolverIAMRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: 2012-10-17
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Path: /custom-iam/
      Policies:
        - PolicyName: LambdaFunctionResolverIAMRolePolicyName
          PolicyDocument:
            Version: 2012-10-17
            Statement:
              - Effect: Allow
                Action: sts:AssumeRole
                Resource: arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME

  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      Code:
        S3Bucket: !Ref LambdaS3Bucket
        S3Key: !Ref LambdaS3Key
        S3ObjectVersion: !Ref LambdaS3ObjectVersion
      Environment:
        Variables:
          VARIABLE_NAME: VARIABLE_VALUE
      Handler: index.lambdaHandler
      Role: !GetAtt LambdaFunctionResolverIAMRole.Arn
      Runtime: nodejs16.x
```
