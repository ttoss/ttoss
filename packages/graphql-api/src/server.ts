import { type SchemaComposer } from 'graphql-compose';
import {
  getGraphQLParameters,
  processRequest,
  renderGraphiQL,
  sendResult,
  shouldRenderGraphiQL,
} from 'graphql-helix';
import express, { Express } from 'express';

export const createServer = ({
  schemaComposer,
}: {
  schemaComposer: SchemaComposer<any>;
}): Express => {
  const server = express();

  server.use(express.json());

  server.use('/graphql', async (req, res) => {
    const request = {
      body: req.body,
      headers: req.headers,
      method: req.method,
      query: req.query,
    };

    if (shouldRenderGraphiQL(request)) {
      res.send(renderGraphiQL());
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

    sendResult(result, res);
  });

  return server;
};
