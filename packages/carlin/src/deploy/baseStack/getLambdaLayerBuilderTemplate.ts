import { NODE_VERSION } from '../../config';
import { getIamPath } from '../../utils';
import {
  BASE_STACK_BUCKET_LOGICAL_NAME,
  BASE_STACK_LAMBDA_LAYER_BUILDER_LOGICAL_NAME,
} from './config';

const CODE_BUILD_PROJECT_LOGS_GROUP_LOGICAL_ID = `${BASE_STACK_LAMBDA_LAYER_BUILDER_LOGICAL_NAME}LogsLogGroup`;

const CODE_BUILD_PROJECT_IAM_ROLE_LOGICAL_ID = `${BASE_STACK_LAMBDA_LAYER_BUILDER_LOGICAL_NAME}Role`;

/**
 * https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html
 */
export const getBuildSpec = () => {
  return `
version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: ${NODE_VERSION}
    commands:
      - npm i --no-bin-links --no-optional --no-package-lock --no-save --no-shrinkwrap $PACKAGE_NAME
      - mkdir nodejs
      - mv node_modules nodejs/node_modules
artifacts:
  files:
    - nodejs/**/*
  name: $PACKAGE_NAME.zip
`.trim();
};

/**
 * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-codebuild-project.html
 */
export const getLambdaLayerBuilderTemplate = () => {
  return {
    Resources: {
      [CODE_BUILD_PROJECT_IAM_ROLE_LOGICAL_ID]: {
        Type: 'AWS::IAM::Role',
        Properties: {
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: ['codebuild.amazonaws.com'],
                },
                Action: ['sts:AssumeRole'],
              },
            ],
          },
          Path: getIamPath(),
          Policies: [
            {
              PolicyName: `${CODE_BUILD_PROJECT_IAM_ROLE_LOGICAL_ID}Policy`,
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                    Resource: '*',
                  },
                  {
                    Effect: 'Allow',
                    Action: ['s3:*'],
                    Resource: [
                      {
                        'Fn::Sub': [
                          'arn:aws:s3:::${BucketName}',
                          {
                            BucketName: {
                              Ref: BASE_STACK_BUCKET_LOGICAL_NAME,
                            },
                          },
                        ],
                      },
                      {
                        'Fn::Sub': [
                          'arn:aws:s3:::${BucketName}/*',
                          {
                            BucketName: {
                              Ref: BASE_STACK_BUCKET_LOGICAL_NAME,
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      },
      [CODE_BUILD_PROJECT_LOGS_GROUP_LOGICAL_ID]: {
        Type: 'AWS::Logs::LogGroup',
        DeletionPolicy: 'Delete',
        Properties: {},
      },
      [BASE_STACK_LAMBDA_LAYER_BUILDER_LOGICAL_NAME]: {
        Type: 'AWS::CodeBuild::Project',
        Properties: {
          Artifacts: {
            Location: { Ref: BASE_STACK_BUCKET_LOGICAL_NAME },
            NamespaceType: 'NONE',
            OverrideArtifactName: true,
            Packaging: 'ZIP',
            Path: 'lambda-layers/packages',
            Type: 'S3',
          },
          Environment: {
            ComputeType: 'BUILD_GENERAL1_SMALL',
            /**
             * Image should match the runtime of the buildspec.
             * https://docs.aws.amazon.com/codebuild/latest/userguide/build-env-ref-available.html
             */
            Image: 'aws/codebuild/standard:7.0',
            Type: 'LINUX_CONTAINER',
          },
          LogsConfig: {
            CloudWatchLogs: {
              GroupName: {
                Ref: `${CODE_BUILD_PROJECT_LOGS_GROUP_LOGICAL_ID}`,
              },
              Status: 'ENABLED',
            },
          },
          ServiceRole: {
            'Fn::GetAtt': `${CODE_BUILD_PROJECT_IAM_ROLE_LOGICAL_ID}.Arn`,
          },
          Source: {
            BuildSpec: getBuildSpec(),
            Type: 'NO_SOURCE',
          },
        },
      },
    },
    Outputs: {
      [BASE_STACK_LAMBDA_LAYER_BUILDER_LOGICAL_NAME]: {
        Value: { Ref: BASE_STACK_LAMBDA_LAYER_BUILDER_LOGICAL_NAME },
      },
    },
  };
};
