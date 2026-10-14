import { CognitoJwtVerifier } from '@ttoss/auth-core/amazon-cognito';
import type { BuildSchemaInput } from '@ttoss/graphql-api';
import { buildSchema } from '@ttoss/graphql-api';
import { App, cors, Router } from '@ttoss/http-server';
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

export type ServerContext = App.Context;

const createJwtVerifier = ({
  authenticationType,
  userPoolConfig,
}: Pick<CreateServerInput, 'authenticationType' | 'userPoolConfig'>) => {
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
};

/**
 * Verify the JWT token and set `ctx.identity`. Returns `false` if the token
 * is invalid.
 */
const authenticate = async ({
  ctx,
  authenticationType,
  jwtVerifier,
}: {
  ctx: ServerContext;
  authenticationType?: AuthenticationType;
  jwtVerifier: ReturnType<typeof createJwtVerifier>;
}) => {
  try {
    if (authenticationType === 'AMAZON_COGNITO_USER_POOLS' && jwtVerifier) {
      const token = ctx.headers.authorization?.replace('Bearer ', '');
      const identity = await jwtVerifier.verify(token || '');
      ctx.identity = identity;
    }
    return true;
  } catch {
    return false;
  }
};

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

  const jwtVerifier = createJwtVerifier({ authenticationType, userPoolConfig });

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
    if (
      !isGraphiqlRequest &&
      !(await authenticate({ ctx, authenticationType, jwtVerifier }))
    ) {
      ctx.status = 401;
      ctx.body = 'Unauthorized';
      return;
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
    for (const [key, value] of response.headers.entries()) {
      ctx.append(key, value);
    }

    ctx.body = response.body;
  });

  return app;
};
