import { BuildSchemaInput, buildSchema } from '@ttoss/graphql-api';
import { type GraphQLObjectType } from 'graphql';
import { decodeCredentials } from '@ttoss/relay-amplify/src/encodeCredentials';
import type { AppSyncResolverHandler as AwsAppSyncResolverHandler } from 'aws-lambda';

export type AppSyncResolverHandler<
  TArguments,
  TResult,
  TSource = Record<string, any> | null
> = AwsAppSyncResolverHandler<TArguments, TResult, TSource>;

export const createAppSyncResolverHandler = ({
  ...buildSchemaInput
}: BuildSchemaInput): AppSyncResolverHandler<any, any, any> => {
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

    const schema = buildSchema(buildSchemaInput);

    const parentType = schema.getType(parentTypeName) as GraphQLObjectType;

    if (!parentType) {
      throw new Error(`Type ${parentTypeName} not found`);
    }

    const field = parentType.getFields()[fieldName];

    const resolver = field?.resolve;

    if (!resolver) {
      throw new Error(`Resolver for ${parentTypeName}.${fieldName} not found`);
    }

    const response = await resolver(
      source,
      args,
      { ...context, identity: event.identity, credentials, headers },
      info as any
    );

    if (response instanceof Error) {
      throw response;
    }

    return response;
  };
};
