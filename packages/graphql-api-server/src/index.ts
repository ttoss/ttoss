import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { type SchemaComposer } from '@ttoss/graphql-api';
import {
  getGraphQLParameters,
  processRequest,
  renderGraphiQL,
  sendResult,
  shouldRenderGraphiQL,
} from 'graphql-helix';
import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';

export { Router };

export type AuthenticationType = 'AMAZON_COGNITO_USER_POOLS';

export const createServer = ({
  schemaComposer,
  graphiql = false,
  authenticationType,
  userPoolConfig,
}: {
  schemaComposer: SchemaComposer<any>;
  graphiql?: boolean;
  authenticationType?: AuthenticationType;
  userPoolConfig?: {
    userPoolId: string;
    tokenUse?: 'access' | 'id';
    clientId: string;
  };
}): Koa => {
  const server = new Koa();

  const router = new Router();

  /**
   * Create the verifier outside your route handlers,
   * so the cache is persisted and can be shared amongst them.
   */
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

  router.all('/graphql', async (ctx) => {
    const request = {
      body: ctx.request.body,
      headers: ctx.headers,
      method: ctx.method,
      query: ctx.request.query,
    };

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

    if (shouldRenderGraphiQL(request)) {
      if (graphiql) {
        ctx.body = renderGraphiQL({});
      }

      return;
    }

    const { operationName, query, variables } = getGraphQLParameters(request);

    const result = await processRequest({
      operationName,
      query,
      variables,
      request,
      schema: schemaComposer.buildSchema(),
      contextFactory: () => {
        return {
          identity: ctx.identity,
        };
      },
    });

    sendResult(result, ctx.res);
  });

  server
    .use(cors())
    .use(bodyParser())
    .use(router.routes())
    .use(router.allowedMethods());

  return server;
};
