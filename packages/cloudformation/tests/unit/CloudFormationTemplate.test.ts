import type { PolicyStatement } from '../../src';
import { importValueFromParameter } from '../../src';

describe('PolicyStatement Resource types', () => {
  test('accepts a string array mixed with CloudFormationImportValue', () => {
    const statement: PolicyStatement = {
      Effect: 'Allow',
      Action: ['lambda:InvokeFunction'],
      Resource: [
        'arn:aws:lambda:*:*:function:MyFunction*',
        importValueFromParameter('LambdaPostgresReadQueryFunctionArn'),
      ],
    };

    expect(statement.Resource).toEqual([
      'arn:aws:lambda:*:*:function:MyFunction*',
      {
        'Fn::ImportValue': {
          'Fn::Sub': '${LambdaPostgresReadQueryFunctionArn}',
        },
      },
    ]);
  });

  test('accepts a single CloudFormationImportValue as Resource', () => {
    const statement: PolicyStatement = {
      Effect: 'Allow',
      Action: ['lambda:InvokeFunction'],
      Resource: importValueFromParameter('MyFunctionArn'),
    };

    expect(statement.Resource).toEqual({
      'Fn::ImportValue': { 'Fn::Sub': '${MyFunctionArn}' },
    });
  });

  test('accepts a plain string as Resource', () => {
    const statement: PolicyStatement = {
      Effect: 'Allow',
      Action: ['s3:GetObject'],
      Resource: 'arn:aws:s3:::my-bucket/*',
    };

    expect(statement.Resource).toBe('arn:aws:s3:::my-bucket/*');
  });

  test('accepts NotResource with mixed array', () => {
    const statement: PolicyStatement = {
      Effect: 'Deny',
      Action: ['*'],
      NotResource: [
        'arn:aws:s3:::my-bucket/*',
        importValueFromParameter('ProtectedResourceArn'),
      ],
    };

    expect(Array.isArray(statement.NotResource)).toBe(true);
  });
});

describe('importValueFromParameter', () => {
  test('returns Fn::ImportValue with Fn::Sub wrapping the parameter name', () => {
    expect(importValueFromParameter('MyParam')).toEqual({
      'Fn::ImportValue': {
        'Fn::Sub': '${MyParam}',
      },
    });
  });

  test('works with any parameter name string', () => {
    const result = importValueFromParameter(
      'AppSyncLambdaDataSourceIAMRoleArn'
    );
    expect(result).toEqual({
      'Fn::ImportValue': {
        'Fn::Sub': '${AppSyncLambdaDataSourceIAMRoleArn}',
      },
    });
  });
});
