import { App, Router, cors } from '@ttoss/http-server';
import { BuildSchemaInput, buildSchema } from '@ttoss/graphql-api';
import { CognitoJwtVerifier } from '@ttoss/auth-core/amazon-cognito';
import { createYoga } from 'graphql-yoga';

export { Router };

export type AuthenticationType = 'AMAZON_COGNITO_USER_POOLS';

export type CreateServerInput = {
  graphiql?: boolean;
  authenticationType?: AuthenticationType;
  userPoolConfig?: {
    userPoolId: string;
    tokenUse?: 'access' | 'id';
    clientId: string;
  };
  cors?: cors.Options;
} & BuildSchemaInput;

export const createServer = ({
  authenticationType,
  userPoolConfig,
  graphiql,
  cors: corsOptions,
  ...buildSchemaInput
}: CreateServerInput): App => {
  const app = new App();

  app.use(cors(corsOptions));

  /**
   * https://the-guild.dev/graphql/yoga-server/docs/integrations/integration-with-koa
   */
  const yoga = createYoga<App.ParameterizedContext>({
    schema: buildSchema(buildSchemaInput),
    graphiql,
    landingPage: false,
    logging: false,
    /**
     * Disable CORS, as it's handled by Koa middleware
     */
    cors: false,
  });

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

  app.use(async (ctx, next) => {
    /**
     * Check if the request is for the GraphQL endpoint.
     * If not, pass it to the next middleware.
     */
    if (ctx.path !== '/graphql') {
      return next();
    }

    const isGraphiqlRequest =
      ctx.headers.accept?.includes('text/html') && graphiql;

    /**
     * If the request is not a GraphiQL request, verify the JWT token, else
     * set Unauthorized status code and return.
     */
    if (!isGraphiqlRequest) {
      try {
        if (authenticationType === 'AMAZON_COGNITO_USER_POOLS' && jwtVerifier) {
          const token = ctx.headers.authorization?.replace('Bearer ', '');
          const identity = await jwtVerifier.verify(token || '');
          ctx.identity = identity;
        }
      } catch {
        ctx.status = 401;
        ctx.body = 'Unauthorized';
        return;
      }
    }

    /**
     * https://the-guild.dev/graphql/yoga-server/docs/integrations/integration-with-koa
     */
    const response = await yoga.handleNodeRequestAndResponse(
      ctx.req,
      ctx.res,
      ctx
    );

    /**
     * Set status code
     */
    ctx.status = response.status;

    /**
     * Set headers
     */
    response.headers.forEach((value, key) => {
      ctx.append(key, value);
    });

    ctx.body = response.body;
  });

  return app;
};
