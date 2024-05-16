import { getLambdaEntryPointsFromTemplate } from '../../../src/deploy/lambda/getLambdaEntryPointsFromTemplate';

test('retrieve lambda entry points from template', () => {
  const template = {
    Resources: {
      LambdaFunction1: {
        Type: 'AWS::Lambda::Function',
        Properties: {
          Handler: 'lambda.handler',
        },
      },
      LambdaFunction2: {
        Type: 'AWS::Lambda::Function',
        Properties: {
          Handler: 'index.handler',
        },
      },
      ServerlessFunction1: {
        Type: 'AWS::Serverless::Function',
        Properties: {
          Handler: 'module/lambda.handler',
        },
      },
      ServerlessFunction2: {
        Type: 'AWS::Serverless::Function',
        Properties: {
          Handler: 'module/method/lambda.handler',
        },
      },
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lambdaEntryPoints = getLambdaEntryPointsFromTemplate(template as any);

  expect(lambdaEntryPoints).toEqual([
    'lambda.ts',
    'index.ts',
    'module/lambda.ts',
    'module/method/lambda.ts',
  ]);
});
