export {
  buildSchema,
  type BuildSchemaInput,
  type Middleware,
} from './buildSchema';
export { composeWithRelay } from './composeWithRelay';
export * from 'graphql-compose';
export { composeWithConnection } from 'graphql-compose-connection';

/**
 * Standard connection arguments used by resolvers created with `composeWithConnection`.
 *
 * @typeParam TFilter - Shape of the connection-specific filter object. Defaults to `unknown`.
 * @typeParam TSort   - Shape of the sort value. Defaults to `unknown`.
 *
 * @example
 * ```ts
 * import { type ConnectionArgs, type ResolverResolveParams } from '@ttoss/graphql-api';
 *
 * type NotificationFilter = { isRead?: boolean | null };
 *
 * NotificationTC.addResolver({
 *   name: 'findMany',
 *   resolve: async ({ args }: ResolverResolveParams<unknown, Context, ConnectionArgs<NotificationFilter>>) => {
 *     return findMany({ first: args.first, after: args.after, filter: args.filter });
 *   },
 * });
 * ```
 */
export type ConnectionArgs<TFilter = unknown, TSort = unknown> = {
  first?: number | null;
  after?: string | null;
  last?: number | null;
  before?: string | null;
  limit?: number | null;
  skip?: number | null;
  sort?: TSort;
  filter?: TFilter | null;
};
