import { type GraphQLSchema } from 'graphql';
import { type SchemaComposer } from 'graphql-compose';
import {
  applyMiddleware,
  type IMiddleware as Middleware,
  type IMiddlewareGenerator as MiddlewareGenerator,
} from 'graphql-middleware';

export type { Middleware, MiddlewareGenerator };

export type BuildSchemaInput<TContext = unknown> = {
  schemaComposer: SchemaComposer<TContext>;
  middlewares?: (
    | Middleware
    | MiddlewareGenerator<unknown, TContext, unknown>
  )[];
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
        if (
          (middleware as MiddlewareGenerator<unknown, unknown, unknown>)
            .generate
        ) {
          return (
            middleware as MiddlewareGenerator<unknown, unknown, unknown>
          ).generate(schema);
        }

        return middleware;
      })
    );
  }

  return schema;
};
