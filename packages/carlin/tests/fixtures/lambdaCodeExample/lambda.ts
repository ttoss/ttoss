import type { APIGatewayProxyHandler } from 'aws-lambda';

import { common } from './commonModule/common';

export const lambdaCodeExampleHandler: APIGatewayProxyHandler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'lambdaCodeExampleHandler' + common,
    }),
  };
};
