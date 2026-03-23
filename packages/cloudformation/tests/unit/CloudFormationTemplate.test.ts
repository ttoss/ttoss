import { importValueFromParameter } from '../../src';

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
