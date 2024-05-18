import { common } from './commonModule/common';
import type { APIGatewayProxyHandler } from 'aws-lambda';

export const lambdaCodeExampleHandler: APIGatewayProxyHandler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'lambdaCodeExampleHandler' + common,
    }),
  };
};
