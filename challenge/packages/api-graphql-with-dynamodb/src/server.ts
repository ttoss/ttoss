/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { type Middleware } from '@ttoss/graphql-api';
import { createServer } from '@ttoss/graphql-api-server';
import { schemaComposer } from './schemaComposer';

const logInput: Middleware = async (
  resolve,
  source,
  args,
  context,
  info
  // eslint-disable-next-line max-params
) => {
  console.log(`1. logInput: ${JSON.stringify(args)}`);
  const result = await resolve(source, args, context, info);
  console.log(context.request.headers['x-api-key']);
  return result;
};

const middleware = {
  Query: {
    video: logInput,
  },
};

const server = createServer({
  schemaComposer,
  graphiql: true,
  middlewares: [middleware],
});

server.listen(4000, () => {
  // eslint-disable-next-line no-console
  console.log(
    'Server is running, GraphQL Playground available at http://localhost:4000/graphql'
  );
});
