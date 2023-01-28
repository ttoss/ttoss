import type { AppSyncResolverHandler as AwsAppSyncResolverHandler } from 'aws-lambda';
import type { SchemaComposer } from 'graphql-compose';

export type AppSyncResolverHandler<
  TArguments,
  TResult,
  TSource = Record<string, any> | null
> = AwsAppSyncResolverHandler<TArguments, TResult, TSource>;

export const createAppSyncResolverHandler = ({
  schemaComposer,
}: {
  schemaComposer: SchemaComposer<any>;
}): AppSyncResolverHandler<any, any, any> => {
  return async (event, context) => {
    const { info, arguments: args, source } = event;
    const { parentTypeName, fieldName } = info;
    const resolver = (
      schemaComposer.getResolveMethods()[parentTypeName] as any
    )[fieldName];
    return resolver(source, args, { ...context, ...event.identity }, info);
  };
};
