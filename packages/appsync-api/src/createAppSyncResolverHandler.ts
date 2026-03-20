/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BuildSchemaInput } from '@ttoss/graphql-api';
import { buildSchema } from '@ttoss/graphql-api';
import type {
  AppSyncIdentity,
  AppSyncResolverHandler as AwsAppSyncResolverHandler,
  Context,
} from 'aws-lambda';
import { type GraphQLObjectType } from 'graphql';

export type AppSyncResolverHandler<
  TArguments,
  TResult,
  TSource = Record<string, any> | null,
> = AwsAppSyncResolverHandler<TArguments, TResult, TSource>;

/**
 * The base context object passed to all AppSync resolvers.
 */
export type BaseAppSyncContext = {
  /** The raw Lambda invocation context. */
  handler: Context;
  /** The AppSync request object (includes headers). */
  request: any;
  /** The caller's identity (Cognito, IAM, Lambda, or OIDC). Null when using API key auth. */
  identity: AppSyncIdentity | null | undefined;
};

export const createAppSyncResolverHandler = ({
  createContext,
  ...buildSchemaInput
}: BuildSchemaInput & {
  /**
   * Optional async function called once per request to enrich the resolver
   * context. The returned object is shallow-merged into the base context and
   * made available to every resolver.
   *
   * Use this for per-request setup such as resolving a `userId` from Cognito.
   * For authorization rules or before/after resolver logic, prefer `middlewares`.
   *
   * @example
   * ```ts
   * createAppSyncResolverHandler({
   *   schemaComposer,
   *   createContext: async ({ identity }) => ({
   *     userId: await getUserIdFromCognitoSub(identity?.sub),
   *   }),
   * });
   * ```
   */
  createContext?: (
    baseContext: BaseAppSyncContext
  ) => Promise<Record<string, any>> | Record<string, any>;
}): AppSyncResolverHandler<any, any, any> => {
  return async (event, appSyncHandlerContext) => {
    const { schemaComposer } = buildSchemaInput;

    /**
     * https://docs.aws.amazon.com/appsync/latest/devguide/resolver-context-reference-js.html
     */
    const { info, arguments: args, source, request } = event;

    const { parentTypeName, fieldName } = info;

    const baseContext: BaseAppSyncContext = {
      handler: appSyncHandlerContext,
      request,
      identity: event.identity,
    };

    const context = createContext
      ? { ...baseContext, ...(await createContext(baseContext)) }
      : baseContext;

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
      context,
      info as any
    );

    if (response instanceof Error) {
      throw response;
    }

    return response;
  };
};
