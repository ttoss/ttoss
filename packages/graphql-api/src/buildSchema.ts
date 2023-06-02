import { type GraphQLSchema } from 'graphql';
import {
  type IMiddleware,
  type IMiddlewareGenerator,
  applyMiddleware,
} from 'graphql-middleware';
import { type SchemaComposer } from 'graphql-compose';

export type { IMiddleware, IMiddlewareGenerator };

export type BuildSchemaInput<TContext = any> = {
  schemaComposer: SchemaComposer<TContext>;
  middlewares?: (IMiddleware | IMiddlewareGenerator<any, TContext, any>)[];
};

export const buildSchema = ({
  schemaComposer,
  middlewares,
}: BuildSchemaInput): GraphQLSchema => {
  if (!schemaComposer) {
    throw new Error('No schemaComposer provided');
  }

  const schema = schemaComposer.buildSchema();

  if (middlewares) {
    return applyMiddleware(
      schema,
      ...middlewares.map((middleware) => {
        /**
         * https://github.com/dimatill/graphql-middleware/issues/433#issuecomment-1170187160
         */
        if ((middleware as IMiddlewareGenerator<any, any, any>).generate) {
          return (middleware as IMiddlewareGenerator<any, any, any>).generate(
            schema
          );
        }

        return middleware;
      })
    );
  }

  return schema;
};
