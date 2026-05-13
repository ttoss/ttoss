import { createLambdaPostgresQueryTemplate } from 'src/cloudformation';

test('should create lambda query template with one default function', () => {
  const template = createLambdaPostgresQueryTemplate();
  expect(template.Parameters).toMatchObject({
    DatabaseHost: {
      Type: 'String',
    },
    DatabaseName: {
      Type: 'String',
    },
    DatabaseUsername: {
      Type: 'String',
    },
    DatabasePassword: {
      Type: 'String',
      NoEcho: true,
    },
    DatabasePort: {
      Type: 'String',
      Default: '5432',
    },
  });

  expect(template.Resources).toMatchObject({
    LambdaPostgresQueryFunction: {
      Type: 'AWS::Lambda::Function',
      Properties: {
        Handler: 'handler.handler',
        Environment: {
          Variables: {
            DATABASE_HOST: { Ref: 'DatabaseHost' },
            DATABASE_NAME: { Ref: 'DatabaseName' },
            DATABASE_USERNAME: { Ref: 'DatabaseUsername' },
            DATABASE_PASSWORD: { Ref: 'DatabasePassword' },
            DATABASE_PORT: { Ref: 'DatabasePort' },
          },
        },
      },
    },
    LambdaPostgresQueryFunctionLogs: {
      Type: 'AWS::Logs::LogGroup',
      DependsOn: 'LambdaPostgresQueryFunction',
    },
  });

  expect(template.Outputs).toMatchObject({
    LambdaPostgresQueryFunction: {
      Value: { Ref: 'LambdaPostgresQueryFunction' },
    },
    LambdaPostgresQueryFunctionArn: {
      Value: { 'Fn::GetAtt': ['LambdaPostgresQueryFunction', 'Arn'] },
    },
  });
});

test('should create multiple lambdas with specific credentials', () => {
  const template = createLambdaPostgresQueryTemplate({
    functions: [
      {
        logicalId: 'LambdaPostgresWriteQueryFunction',
        databaseParameters: {
          host: 'WriteDatabaseHost',
          name: 'WriteDatabaseName',
          username: 'WriteDatabaseUsername',
          password: 'WriteDatabasePassword',
          port: 'WriteDatabasePort',
        },
      },
      {
        logicalId: 'LambdaPostgresReadQueryFunction',
        handler: 'handler.readOnlyHandler',
        outputArnName: 'LambdaPostgresReadQueryFunctionArn',
        databaseParameters: {
          host: 'ReadDatabaseHost',
          name: 'ReadDatabaseName',
          username: 'ReadDatabaseUsername',
          password: 'ReadDatabasePassword',
          port: 'ReadDatabasePort',
        },
      },
    ],
  });

  expect(template.Parameters).toMatchObject({
    WriteDatabaseHost: { Type: 'String' },
    WriteDatabaseName: { Type: 'String' },
    WriteDatabaseUsername: { Type: 'String' },
    WriteDatabasePassword: { Type: 'String', NoEcho: true },
    WriteDatabasePort: { Type: 'String', Default: '5432' },
    ReadDatabaseHost: { Type: 'String' },
    ReadDatabaseName: { Type: 'String' },
    ReadDatabaseUsername: { Type: 'String' },
    ReadDatabasePassword: { Type: 'String', NoEcho: true },
    ReadDatabasePort: { Type: 'String', Default: '5432' },
  });

  expect(template.Resources).toMatchObject({
    LambdaPostgresWriteQueryFunction: {
      Type: 'AWS::Lambda::Function',
      Properties: {
        Handler: 'handler.handler',
        Environment: {
          Variables: {
            DATABASE_HOST: { Ref: 'WriteDatabaseHost' },
            DATABASE_NAME: { Ref: 'WriteDatabaseName' },
            DATABASE_USERNAME: { Ref: 'WriteDatabaseUsername' },
            DATABASE_PASSWORD: { Ref: 'WriteDatabasePassword' },
            DATABASE_PORT: { Ref: 'WriteDatabasePort' },
          },
        },
      },
    },
    LambdaPostgresReadQueryFunction: {
      Type: 'AWS::Lambda::Function',
      Properties: {
        Handler: 'handler.readOnlyHandler',
        Environment: {
          Variables: {
            DATABASE_HOST: { Ref: 'ReadDatabaseHost' },
            DATABASE_NAME: { Ref: 'ReadDatabaseName' },
            DATABASE_USERNAME: { Ref: 'ReadDatabaseUsername' },
            DATABASE_PASSWORD: { Ref: 'ReadDatabasePassword' },
            DATABASE_PORT: { Ref: 'ReadDatabasePort' },
          },
        },
      },
    },
  });

  expect(template.Outputs).toMatchObject({
    LambdaPostgresWriteQueryFunction: {
      Value: { Ref: 'LambdaPostgresWriteQueryFunction' },
    },
    LambdaPostgresWriteQueryFunctionArn: {
      Value: { 'Fn::GetAtt': ['LambdaPostgresWriteQueryFunction', 'Arn'] },
    },
    LambdaPostgresReadQueryFunction: {
      Value: { Ref: 'LambdaPostgresReadQueryFunction' },
    },
    LambdaPostgresReadQueryFunctionArn: {
      Value: { 'Fn::GetAtt': ['LambdaPostgresReadQueryFunction', 'Arn'] },
    },
  });
});
