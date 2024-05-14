import { APIGatewayProxyHandler } from 'aws-lambda';

export const lambdaCodeExampleHandler: APIGatewayProxyHandler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'lambdaCodeExampleHandler',
    }),
  };
};
