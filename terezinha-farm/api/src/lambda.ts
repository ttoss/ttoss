import { allow, deny, shield } from 'graphql-shield';
import { createAppSyncResolverHandler } from '@ttoss/appsync-api';
import { schemaComposer } from './schemaComposer';

const NotAuthorisedError = new Error('Not Authorised!');
NotAuthorisedError.name = 'NotAuthorised';

const permissions = shield(
  {
    Query: {
      user: deny,
    },
  },
  {
    fallbackRule: deny,
    fallbackError: NotAuthorisedError,
  }
);

export const handler = createAppSyncResolverHandler({
  schemaComposer,
  middlewares: [permissions],
});
