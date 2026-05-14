import type {
  CloudFormationTemplate,
  Outputs,
  Parameters,
  Resources,
} from '@ttoss/cloudformation';

export type { CloudFormationTemplate };

export const HANDLER_DEFAULT = 'handler.handler';

export const LAMBDA_POSTGRES_QUERY_FUNCTION_DEFAULT_NAME =
  'LambdaPostgresQueryFunction';

export const MEMORY_SIZE_DEFAULT = 128;

export const TIMEOUT_DEFAULT = 30;

export type DatabaseParameters = {
  host: string;
  name: string;
  username: string;
  password: string;
  port: string;
};

export type LambdaDefinition = {
  name?: string;
  logicalId?: string;
  handler?: string;
  databaseParameters?: DatabaseParameters;
  outputArnName?: string;
};

export type CreateLambdaPostgresQueryTemplateOptions = {
  functions?: LambdaDefinition[];
  memorySize?: number;
  timeout?: number;
  deletionProtection?: boolean;
};

export const DATABASE_PARAMETERS_DEFAULT: DatabaseParameters = {
  host: 'DatabaseHost',
  name: 'DatabaseName',
  username: 'DatabaseUsername',
  password: 'DatabasePassword',
  port: 'DatabasePort',
};

type NormalizedLambdaDefinition = {
  name: string;
  handler: string;
  databaseParameters: DatabaseParameters;
  outputArnName: string;
};

const createParameter = ({
  description,
  noEcho,
  defaultValue,
}: {
  description: string;
  noEcho?: boolean;
  defaultValue?: string;
}) => {
  return {
    Type: 'String',
    Description: description,
    ...(noEcho ? { NoEcho: true } : {}),
    ...(defaultValue ? { Default: defaultValue } : {}),
  };
};

const createDefaultFunction = (): NormalizedLambdaDefinition => {
  return {
    name: LAMBDA_POSTGRES_QUERY_FUNCTION_DEFAULT_NAME,
    handler: HANDLER_DEFAULT,
    databaseParameters: DATABASE_PARAMETERS_DEFAULT,
    outputArnName: 'LambdaPostgresQueryFunctionArn',
  };
};

const resolveFunctionName = ({
  name,
  logicalId,
}: {
  name?: string;
  logicalId?: string;
}) => {
  const functionName = name || logicalId;

  return functionName || LAMBDA_POSTGRES_QUERY_FUNCTION_DEFAULT_NAME;
};

const normalizeFunctions = ({
  functions,
}: {
  functions?: LambdaDefinition[];
}): NormalizedLambdaDefinition[] => {
  if (!functions?.length) {
    return [createDefaultFunction()];
  }

  return functions.map((lambdaFunction) => {
    const functionName = resolveFunctionName({
      name: lambdaFunction.name,
      logicalId: lambdaFunction.logicalId,
    });

    return {
      name: functionName,
      handler: lambdaFunction.handler || HANDLER_DEFAULT,
      outputArnName: lambdaFunction.outputArnName || `${functionName}Arn`,
      databaseParameters:
        lambdaFunction.databaseParameters || DATABASE_PARAMETERS_DEFAULT,
    };
  });
};

const createDatabaseParametersForFunction = ({
  databaseParameters,
  functionName,
  allParameters,
}: {
  databaseParameters: DatabaseParameters;
  functionName: string;
  allParameters: Parameters;
}) => {
  return {
    [databaseParameters.host]:
      allParameters[databaseParameters.host] ||
      createParameter({
        description: `Database host for ${functionName}.`,
      }),
    [databaseParameters.name]:
      allParameters[databaseParameters.name] ||
      createParameter({
        description: `Database name for ${functionName}.`,
      }),
    [databaseParameters.username]:
      allParameters[databaseParameters.username] ||
      createParameter({
        description: `Database username for ${functionName}.`,
      }),
    [databaseParameters.password]:
      allParameters[databaseParameters.password] ||
      createParameter({
        description: `Database password for ${functionName}.`,
        noEcho: true,
      }),
    [databaseParameters.port]:
      allParameters[databaseParameters.port] ||
      createParameter({
        description: `Database port for ${functionName}.`,
        defaultValue: '5432',
      }),
  };
};

const createCredentialsParameters = ({
  functions,
}: {
  functions: NormalizedLambdaDefinition[];
}) => {
  return functions.reduce((allParameters, lambdaFunction) => {
    return {
      ...allParameters,
      ...createDatabaseParametersForFunction({
        databaseParameters: lambdaFunction.databaseParameters,
        functionName: lambdaFunction.name,
        allParameters,
      }),
    };
  }, {} as Parameters);
};

const createLambdaResource = ({
  functionName,
  handler,
  databaseParameters,
  memorySize,
  timeout,
  deletionProtection,
}: {
  functionName: string;
  handler: string;
  databaseParameters: DatabaseParameters;
  memorySize: number;
  timeout: number;
  deletionProtection: boolean;
}) => {
  const resourcePolicies = deletionProtection
    ? {
        DeletionPolicy: 'Retain' as const,
        UpdateReplacePolicy: 'Retain' as const,
      }
    : {};

  return {
    [functionName]: {
      Type: 'AWS::Lambda::Function',
      ...resourcePolicies,
      Properties: {
        Code: {
          S3Bucket: { Ref: 'LambdaS3Bucket' },
          S3Key: { Ref: 'LambdaS3Key' },
          S3ObjectVersion: { Ref: 'LambdaS3ObjectVersion' },
        },
        MemorySize: memorySize,
        Timeout: timeout,
        Handler: handler,
        Role: { 'Fn::GetAtt': ['LambdaQueryExecutionRole', 'Arn'] },
        Runtime: 'nodejs24.x',
        Environment: {
          Variables: {
            DATABASE_HOST: { Ref: databaseParameters.host },
            DATABASE_NAME: { Ref: databaseParameters.name },
            DATABASE_USERNAME: { Ref: databaseParameters.username },
            DATABASE_PASSWORD: { Ref: databaseParameters.password },
            DATABASE_PORT: { Ref: databaseParameters.port },
          },
        },
        VpcConfig: {
          SecurityGroupIds: { Ref: 'SecurityGroupIds' },
          SubnetIds: { Ref: 'SubnetIds' },
        },
      },
    },
  };
};

const createLambdaLogResource = ({ logicalId }: { logicalId: string }) => {
  return {
    [`${logicalId}Logs`]: {
      Type: 'AWS::Logs::LogGroup',
      DependsOn: logicalId,
      Properties: {
        LogGroupName: {
          'Fn::Join': ['', ['/aws/lambda/', { Ref: logicalId }]],
        },
        RetentionInDays: 3,
      },
    },
  };
};

const createResources = ({
  functions,
  memorySize,
  timeout,
  deletionProtection,
}: {
  functions: NormalizedLambdaDefinition[];
  memorySize: number;
  timeout: number;
  deletionProtection: boolean;
}) => {
  return functions.reduce((allResources, lambdaFunction) => {
    const { name, handler, databaseParameters } = lambdaFunction;

    return {
      ...allResources,
      ...createLambdaResource({
        functionName: name,
        handler,
        databaseParameters,
        memorySize,
        timeout,
        deletionProtection,
      }),
      ...createLambdaLogResource({ logicalId: name }),
    };
  }, {} as Resources);
};

const createOutputs = ({
  functions,
}: {
  functions: NormalizedLambdaDefinition[];
}) => {
  return functions.reduce((allOutputs, lambdaFunction) => {
    const { name, outputArnName } = lambdaFunction;

    return {
      ...allOutputs,
      [name]: {
        Description: `Lambda function to query PostgreSQL (${name}).`,
        Value: { Ref: name },
      },
      [outputArnName]: {
        Description: `Lambda function to query PostgreSQL (${name}) ARN.`,
        Value: { 'Fn::GetAtt': [name, 'Arn'] },
        Export: {
          Name: {
            'Fn::Sub': `\${AWS::StackName}-${outputArnName}`,
          },
        },
      },
    };
  }, {} as Outputs);
};

const createTemplateParameters = ({
  credentialsParameters,
}: {
  credentialsParameters: Parameters;
}): Parameters => {
  return {
    ...credentialsParameters,
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
  };
};

const createExecutionRoleResource = (): Resources => {
  return {
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
  };
};

export const createLambdaPostgresQueryTemplate = ({
  functions,
  memorySize = MEMORY_SIZE_DEFAULT,
  timeout = TIMEOUT_DEFAULT,
  deletionProtection = false,
}: CreateLambdaPostgresQueryTemplateOptions = {}): CloudFormationTemplate => {
  const templateFunctions = normalizeFunctions({ functions });

  const credentialsParameters = createCredentialsParameters({
    functions: templateFunctions,
  });

  const templateResources = createResources({
    functions: templateFunctions,
    memorySize,
    timeout,
    deletionProtection,
  });

  const templateOutputs = createOutputs({
    functions: templateFunctions,
  });

  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'A Lambda function to query PostgreSQL.',
    Parameters: createTemplateParameters({ credentialsParameters }),
    Resources: {
      ...createExecutionRoleResource(),
      ...templateResources,
    },
    Outputs: templateOutputs,
  };
};
