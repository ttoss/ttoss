import { BuildSchemaInput, buildSchema } from '@ttoss/graphql-api';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { createYoga } from 'graphql-yoga';
import Koa from 'koa';

export type AuthenticationType = 'AMAZON_COGNITO_USER_POOLS';

export type CreateServerInput = {
  graphiql?: boolean;
  authenticationType?: AuthenticationType;
  userPoolConfig?: {
    userPoolId: string;
    tokenUse?: 'access' | 'id';
    clientId: string;
  };
} & BuildSchemaInput;

export const createServer = ({
  authenticationType,
  userPoolConfig,
  ...buildSchemaInput
}: CreateServerInput): Koa => {
  const app = new Koa();

  const jwtVerifier = (() => {
    if (authenticationType === 'AMAZON_COGNITO_USER_POOLS') {
      if (!userPoolConfig) {
        throw new Error(
          'userPoolConfig is required when using AMAZON_COGNITO_USER_POOLS authenticationType'
        );
      }
      return CognitoJwtVerifier.create({
        tokenUse: 'access',
        ...userPoolConfig,
      });
    }

    return null;
  })();

  app.use(async (ctx) => {
    const request = {
      body: ctx.request.body,
      headers: ctx.headers,
      method: ctx.method,
      query: ctx.request.query,
    };

    if (
      request.method !== 'GET' &&
      request.headers.referer !== 'http://localhost:4000/graphql'
    ) {
      try {
        if (authenticationType === 'AMAZON_COGNITO_USER_POOLS' && jwtVerifier) {
          const token = request.headers.authorization?.replace('Bearer ', '');
          const identity = await jwtVerifier.verify(token || '');

          ctx.identity = identity;
        }
      } catch {
        ctx.status = 401;
        ctx.body = 'Unauthorized';
        return;
      }
    }

    //console.log(ctx.identity);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const operationName = request.body;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const query = request.headers;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const variables = request.method;

    const yoga = createYoga<Koa.ParameterizedContext>({
      schema: buildSchema(buildSchemaInput),
      logging: false,
    });

    const response = await yoga.handleNodeRequest(ctx.req, ctx);

    // Set status code
    ctx.status = response.status;

    // Set headers
    for (const [key, value] of response.headers.entries()) {
      if (ctx.status != 401) {
        ctx.append(key, value);
      }
    }

    ctx.body = response.body;
  });

  return app;
};
