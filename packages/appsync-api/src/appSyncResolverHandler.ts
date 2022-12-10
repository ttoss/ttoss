import type { AppSyncResolverHandler } from 'aws-lambda';
import type { SchemaComposer } from 'graphql-compose';

export const appSyncResolverHandler = ({
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
    return resolver(source, args, context, info);
  };
};
