import { ObjectTypeComposer, schemaComposer } from 'graphql-compose';
import graphqlComposeWithRelay from 'graphql-compose-relay';

export const composeWithRelay = (type: ObjectTypeComposer) => {
  /**
   * Implement node on Query.
   */
  graphqlComposeWithRelay(schemaComposer.Query);

  /**
   * Implement node interface for the type.
   */
  graphqlComposeWithRelay(type);
};
