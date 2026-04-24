import type { IMiddlewareFunction } from '@ttoss/graphql-api/shield';
import type { GraphQLResolveInfo } from 'graphql';

/**
 * The shape of the `info` object passed to AppSync resolvers at runtime.
 *
 * This differs from the standard `GraphQLResolveInfo` used by `graphql-middleware`.
 * AppSync provides a flat `parentTypeName: string` field instead of the nested
 * `parentType: { name: string }` object found in standard GraphQL execution.
 *
 * @see https://docs.aws.amazon.com/appsync/latest/devguide/resolver-context-reference.html
 */
export type AppSyncInfo = {
  /** The name of the field that is currently being resolved. */
  fieldName: string;
  /** The name of the parent type for the field that is currently being resolved. */
  parentTypeName: string;
  /** A map which holds all variables that are passed into the GraphQL request. */
  variables: Record<string, unknown>;
  /** A list representation of the fields in the GraphQL selection set. */
  selectionSetList: string[];
  /** A string representation of the selection set, formatted as GraphQL SDL. */
  selectionSetGraphQL: string;
};

type AppSyncMiddlewareFn<TSource, TContext, TArgs> = (
  resolve: (
    source: TSource,
    args: TArgs,
    context: TContext,
    info: AppSyncInfo
  ) => unknown | Promise<unknown>,
  source: TSource,
  args: TArgs,
  context: TContext,
  info: AppSyncInfo
) => unknown | Promise<unknown>;

/**
 * Creates a properly-typed AppSync middleware function.
 *
 * When using `@ttoss/appsync-api`, the `info` object passed to resolvers has
 * the AppSync-specific shape ({@link AppSyncInfo}), not the standard
 * `GraphQLResolveInfo` expected by `graphql-middleware`. This helper lets you
 * write middlewares with the correct AppSync `info` type while remaining
 * compatible with the `BuildSchemaInput.middlewares` array.
 *
 * @example
 * ```ts
 * import { createAppSyncMiddleware } from '@ttoss/appsync-api';
 *
 * const timingMiddleware = createAppSyncMiddleware(
 *   async (resolve, source, args, context, info) => {
 *     const start = Date.now();
 *     const resolverName = `${info.parentTypeName}.${info.fieldName}`;
 *     try {
 *       const result = await resolve(source, args, context, info);
 *       console.log(`${resolverName} took ${Date.now() - start}ms`);
 *       return result;
 *     } catch (error) {
 *       console.error(`${resolverName} failed after ${Date.now() - start}ms`);
 *       throw error;
 *     }
 *   }
 * );
 * ```
 */
export const createAppSyncMiddleware = <
  TSource = unknown,
  TContext = unknown,
  TArgs = unknown,
>(
  fn: AppSyncMiddlewareFn<TSource, TContext, TArgs>
): IMiddlewareFunction<TSource, TContext, TArgs> => {
  return (resolve, source, args, context, info) => {
    return Promise.resolve(
      fn(
        (src, innerArgs, ctx, innerInfo) => {
          return resolve(
            src,
            innerArgs,
            ctx,
            innerInfo as unknown as GraphQLResolveInfo
          );
        },
        source,
        args,
        context,
        info as unknown as AppSyncInfo
      )
    );
  };
};
