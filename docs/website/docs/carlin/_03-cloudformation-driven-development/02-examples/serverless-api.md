---
title: Serverless API
---

```yaml title="cloudformation.yml"
AWSTemplateFormatVersion: 2010-09-09

Transform: AWS::Serverless-2016-10-31

Parameters:
  LambdaS3Bucket:
    Type: String

  LambdaS3Key:
    Type: String

  LambdaS3ObjectVersion:
    Type: String

Globals:
  Api:
    Auth:
      ApiKeyRequired: false
  Function:
    CodeUri:
      Bucket: !Ref LambdaS3Bucket
      Key: !Ref LambdaS3Key
      Version: !Ref LambdaS3ObjectVersion
    Runtime: nodejs16.x

Resources:
  ApiV1ServerlessApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: v1

  ApiV1ServerlessFunction:
    Type: AWS::Serverless::Function
    Properties:
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Method: ANY
            Path: /{proxy+}
            RestApiId: !Ref ApiV1ServerlessApi
      Handler: index.handler
      Role: !GetAtt LambdaFunctionResolverIAMRole.Arn

Outputs:
  ApiV1Endpoint:
    Description: API v1 stage endpoint.
    Value: !Sub https://${ApiV1ServerlessApi}.execute-api.${AWS::Region}.amazonaws.com/v1/
```
