import { decodeCredentials } from '@ttoss/relay-amplify/src/encodeCredentials';
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
    const { info, arguments: args, source, request } = event;

    const { parentTypeName, fieldName } = info;

    const headers = request?.headers || {};

    const credentials = (() => {
      const headersCredentials = headers?.['x-credentials'];

      if (!headersCredentials) {
        return null;
      }

      return decodeCredentials(headersCredentials);
    })();

    const resolveMethods = schemaComposer.getResolveMethods();

    const resolver = (resolveMethods[parentTypeName] as any)[fieldName];

    return resolver(
      source,
      args,
      { ...context, identity: event.identity, credentials, headers },
      info
    );
  };
};
