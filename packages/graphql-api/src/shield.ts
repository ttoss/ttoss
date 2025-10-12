export * from 'graphql-shield';
/**
 * Export types from graphql-middleware to avoid "The inferred type of 'x'
 * cannot be named without a reference to '.../graphql-middleware/index.d.ts(1,1)'.
 * This is likely not portable. A type annotation is necessary."
 */
export type {
  IMiddleware,
  IMiddlewareFieldMap,
  IMiddlewareFunction,
  IMiddlewareGenerator,
  IMiddlewareGeneratorConstructor,
  IMiddlewareTypeMap,
} from 'graphql-middleware';
