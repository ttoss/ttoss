import 'dotenv/config';

import { createServer } from '@ttoss/graphql-api-server';
import { schemaComposer } from './schemaComposer';

const server = createServer({
  schemaComposer,
  graphiql: true,
});

server.listen(4000, () => {
  // eslint-disable-next-line no-console
  console.log(
    'Server is running, GraphQL Playground available at http://localhost:4000/graphql'
  );
});
