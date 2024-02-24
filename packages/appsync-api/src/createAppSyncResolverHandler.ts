/* eslint-disable @typescript-eslint/no-explicit-any */
import { BuildSchemaInput, buildSchema } from '@ttoss/graphql-api';
import { type GraphQLObjectType } from 'graphql';
import { decode } from '@ttoss/auth-core';
import type { AppSyncResolverHandler as AwsAppSyncResolverHandler } from 'aws-lambda';

export type AppSyncResolverHandler<
  TArguments,
  TResult,
  TSource = Record<string, any> | null,
> = AwsAppSyncResolverHandler<TArguments, TResult, TSource>;

export const createAppSyncResolverHandler = ({
  ...buildSchemaInput
}: BuildSchemaInput): AppSyncResolverHandler<any, any, any> => {
  return async (event, context) => {
    const { schemaComposer } = buildSchemaInput;

    const { info, arguments: args, source, request } = event;

    const { parentTypeName, fieldName } = info;

    const headers = request?.headers || {};

    const credentials = (() => {
      const headersCredentials = headers?.['x-credentials'];

      if (!headersCredentials) {
        return null;
      }

      return decode(headersCredentials);
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

    /**
     * `composeWithConnection` findMany resolver needs sort to be the enum
     * value defined in the enum instead the enum name.
     * For example, if the config `sort.ID_ASC.value` is `{ order : 'ASC' }`,
     * then the value of the argument `sort` enm should be
     * `{ order : 'ASC' }` instead of `'ID_ASC'`.
     */
    const argsWithEnumValues = (() => {
      const fieldsArgsIsEnumType = field.args.filter((arg) => {
        return schemaComposer.isEnumType(arg.type);
      });

      const enumArgs = fieldsArgsIsEnumType
        .map((enumArg) => {
          if (!args[enumArg.name]) {
            return { [enumArg.name]: enumArg.defaultValue };
          }

          const values = schemaComposer.getETC(enumArg.type).getFields();

          return {
            [enumArg.name]: values[args[enumArg.name]].value,
          };
        })
        .reduce((acc, curr) => {
          return { ...acc, ...curr };
        }, {});

      /**
       * If `args.sort` has sort name, i.e. `ID_ASC`, then `enumArgs` will
       * replace it with the value of the enum, i.e. `{ order : 'ASC' }`.
       */
      return { ...args, ...enumArgs };
    })();

    const response = await resolver(
      source,
      argsWithEnumValues,
      { ...context, identity: event.identity, credentials, headers },
      info as any
    );

    if (response instanceof Error) {
      throw response;
    }

    return response;
  };
};
