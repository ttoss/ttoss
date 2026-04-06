import { createLambdaPostgresQueryTemplate } from 'src/cloudformation';

test('should create lambda query template', () => {
  const template = createLambdaPostgresQueryTemplate();
  expect(template).toEqual({
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'A Lambda function to query PostgreSQL.',
    Parameters: {
      DatabaseHost: {
        Type: 'String',
        Description: 'Database host.',
      },
      DatabaseHostReadOnly: {
        Type: 'String',
        Description: 'Database host read only.',
      },
      DatabaseName: {
        Type: 'String',
        Description: 'Database name.',
      },
      DatabaseUsername: {
        Type: 'String',
        Description: 'Database username.',
      },
      DatabasePassword: {
        Type: 'String',
        Description: 'Database password.',
        NoEcho: true,
      },
      DatabasePort: {
        Type: 'String',
        Default: '5432',
        Description: 'Database port.',
      },
      DatabaseNameReadOnly: {
        Type: 'String',
        Description: 'Database name for read-only access.',
      },
      DatabaseUsernameReadOnly: {
        Type: 'String',
        Description: 'Database username for read-only access.',
      },
      DatabasePasswordReadOnly: {
        Type: 'String',
        Description: 'Database password for read-only access.',
        NoEcho: true,
      },
      DatabasePortReadOnly: {
        Type: 'String',
        Default: '5432',
        Description: 'Database port for read-only access.',
      },
      LambdaS3Bucket: {
        Type: 'String',
        Description: 'The S3 bucket where the Lambda code is stored.',
      },
      LambdaS3Key: {
        Type: 'String',
        Description: 'The S3 key where the Lambda code is stored.',
      },
      LambdaS3ObjectVersion: {
        Type: 'String',
        Description: 'The S3 object version of the Lambda code.',
      },
      SecurityGroupIds: {
        Description: 'Security Group IDs',
        Type: 'List<AWS::EC2::SecurityGroup::Id>',
      },
      SubnetIds: {
        Description: 'Subnet IDs',
        Type: 'List<AWS::EC2::Subnet::Id>',
      },
    },
    Resources: {
      LambdaQueryExecutionRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com',
                },
                Action: 'sts:AssumeRole',
              },
            ],
          },
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
          ],
        },
      },
      LambdaQueryFunction: {
        Type: 'AWS::Lambda::Function',
        Properties: {
          Code: {
            S3Bucket: {
              Ref: 'LambdaS3Bucket',
            },
            S3Key: {
              Ref: 'LambdaS3Key',
            },
            S3ObjectVersion: {
              Ref: 'LambdaS3ObjectVersion',
            },
          },
          MemorySize: 128,
          Timeout: 30,
          Handler: 'handler.handler',
          Role: {
            'Fn::GetAtt': ['LambdaQueryExecutionRole', 'Arn'],
          },
          Runtime: 'nodejs24.x',
          Environment: {
            Variables: {
              DATABASE_HOST: {
                Ref: 'DatabaseHost',
              },
              DATABASE_NAME: {
                Ref: 'DatabaseName',
              },
              DATABASE_USERNAME: {
                Ref: 'DatabaseUsername',
              },
              DATABASE_PASSWORD: {
                Ref: 'DatabasePassword',
              },
              DATABASE_PORT: {
                Ref: 'DatabasePort',
              },
            },
          },
          VpcConfig: {
            SecurityGroupIds: {
              Ref: 'SecurityGroupIds',
            },
            SubnetIds: {
              Ref: 'SubnetIds',
            },
          },
        },
      },
      LambdaQueryFunctionLogs: {
        Type: 'AWS::Logs::LogGroup',
        DependsOn: 'LambdaQueryFunction',
        Properties: {
          LogGroupName: {
            'Fn::Join': ['', ['/aws/lambda/', { Ref: 'LambdaQueryFunction' }]],
          },
          RetentionInDays: 3,
        },
      },
      LambdaReadOnlyQueryFunction: {
        Type: 'AWS::Lambda::Function',
        Properties: {
          Code: {
            S3Bucket: {
              Ref: 'LambdaS3Bucket',
            },
            S3Key: {
              Ref: 'LambdaS3Key',
            },
            S3ObjectVersion: {
              Ref: 'LambdaS3ObjectVersion',
            },
          },
          MemorySize: 128,
          Timeout: 30,
          Handler: 'handler.readOnlyHandler',
          Role: {
            'Fn::GetAtt': ['LambdaQueryExecutionRole', 'Arn'],
          },
          Runtime: 'nodejs24.x',
          Environment: {
            Variables: {
              DATABASE_HOST: {
                Ref: 'DatabaseHost',
              },
              DATABASE_NAME: {
                Ref: 'DatabaseName',
              },
              DATABASE_USERNAME: {
                Ref: 'DatabaseUsername',
              },
              DATABASE_PASSWORD: {
                Ref: 'DatabasePassword',
              },
              DATABASE_PORT: {
                Ref: 'DatabasePort',
              },
              DATABASE_HOST_READ_ONLY: {
                Ref: 'DatabaseHostReadOnly',
              },
              DATABASE_NAME_READ_ONLY: {
                Ref: 'DatabaseNameReadOnly',
              },
              DATABASE_USERNAME_READ_ONLY: {
                Ref: 'DatabaseUsernameReadOnly',
              },
              DATABASE_PASSWORD_READ_ONLY: {
                Ref: 'DatabasePasswordReadOnly',
              },
              DATABASE_PORT_READ_ONLY: {
                Ref: 'DatabasePortReadOnly',
              },
            },
          },
          VpcConfig: {
            SecurityGroupIds: {
              Ref: 'SecurityGroupIds',
            },
            SubnetIds: {
              Ref: 'SubnetIds',
            },
          },
        },
      },
      LambdaReadOnlyQueryFunctionLogs: {
        Type: 'AWS::Logs::LogGroup',
        DependsOn: 'LambdaReadOnlyQueryFunction',
        Properties: {
          LogGroupName: {
            'Fn::Join': [
              '',
              ['/aws/lambda/', { Ref: 'LambdaReadOnlyQueryFunction' }],
            ],
          },
          RetentionInDays: 3,
        },
      },
    },
    Outputs: {
      LambdaPostgresQueryFunction: {
        Description: 'Lambda function to query PostgreSQL.',
        Value: {
          Ref: 'LambdaQueryFunction',
        },
      },
      LambdaPostgresQueryFunctionArn: {
        Description: 'Lambda function to query PostgreSQL ARN.',
        Value: {
          'Fn::GetAtt': ['LambdaQueryFunction', 'Arn'],
        },
      },
      LambdaPostgresReadOnlyQueryFunction: {
        Description: 'Lambda function to query PostgreSQL (read-only).',
        Value: {
          Ref: 'LambdaReadOnlyQueryFunction',
        },
      },
      LambdaPostgresReadOnlyQueryFunctionArn: {
        Description: 'Lambda function to query PostgreSQL (read-only) ARN.',
        Value: {
          'Fn::GetAtt': ['LambdaReadOnlyQueryFunction', 'Arn'],
        },
      },
    },
  });
});
