import { type SchemaComposer } from 'graphql-compose';
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

export { Router };

export const createServer = ({
  schemaComposer,
  graphiql = false,
}: {
  schemaComposer: SchemaComposer<any>;
  graphiql?: boolean;
}): Koa => {
  const server = new Koa();

  const router = new Router();

  server.use(bodyParser());

  router.all('/graphql', async (ctx) => {
    const request = {
      body: ctx.request.body,
      headers: ctx.headers,
      method: ctx.method,
      query: ctx.request.query,
    };

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
    });

    sendResult(result, ctx.res);
  });

  server.use(router.routes()).use(router.allowedMethods());

  return server;
};
