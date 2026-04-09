# @ttoss/graphql-api

This package offers an opinionated approach to building a GraphQL API using the **ttoss ecosystem modules**. It is designed to provide a resilient and scalable solution for creating complex GraphQL APIs while focusing on the following goals:

1. **Modular Design**:  
   Build your GraphQL API using modules to simplify and organize the development of large, complex APIs.

1. **Relay Compatibility**:  
   As **Relay** is the primary GraphQL client in the ttoss ecosystem, this package implements the [Relay Server Specification](https://relay.dev/docs/guides/graphql-server-specification/) for seamless client-server interaction.

1. **Schema Building**:  
   Generate the GraphQL schema required for Relay's introspection queries with [@ttoss/graphql-api-cli](https://ttoss.dev/docs/modules/packages/graphql-api-cli/).

1. **TypeScript Types Generation**:
   Automatically generate TypeScript types for your GraphQL schema with [@ttoss/graphql-api-cli](https://ttoss.dev/docs/modules/packages/graphql-api-cli/).

1. **AWS AppSync Support**:
   Create GraphQL APIs compatible with AWS AppSync. Additionally, this package includes support for running a local GraphQL API server for development and testing purposes.

## Installation

```bash
pnpm add @ttoss/graphql-api graphql
```

## Usage

This library uses [`graphql-compose`](https://graphql-compose.github.io/) to create the GraphQL schema. It re-exports all the [`graphql-compose`](https://graphql-compose.github.io/) types and methods, so you can use it directly from this package.

### Type Creation

For more examples about how to create types, check the [`graphql-compose`](https://graphql-compose.github.io/docs/basics/understanding-types.html) documentation.

```ts
import { schemaComposer } from '@ttoss/graphql-api';

const UserTC = schemaComposer.createObjectTC({
  name: 'User',
  fields: {
    id: 'ID!',
    name: 'String!',
  },
});
```

This library uses the `tsconfig.json` file from the target package it is being applied on. If you are using relative imports in your package you can skip this section, but, if you use path aliases in your typescript code by leveraging the [`paths`](https://www.typescriptlang.org/tsconfig#paths) property, the [`baseUrl`](https://www.typescriptlang.org/tsconfig#baseUrl) must be filled accordingly. This is needed because in order to interpret the path aliases, `ts-node` uses [`tsconfig-paths`](https://github.com/dividab/tsconfig-paths) to resolve the modules that uses this config, and `tsconfig-paths` needs both `baseUrl` and `paths` values to be non-null. A `tsconfig.json` example that follows such recommendations is given below:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "src/*": ["src/*"]
    }
  }
}
```

### Resolvers

#### Creating Resolvers

Resolvers are functions that resolve a value for a type or field in your schema. Here’s a simple example of how to create a resolver for the `User` type:

```ts
UserTC.addResolver({
  name: 'findById',
  type: UserTC,
  args: {
    id: 'String!',
  },
  resolve: async ({ args }) => {
    // Implement your logic to find a user by ID
    return await findUserById(args.id);
  },
});
```

### Integrate All Modules

Once you've created all your types and resolvers, you can integrate all the modules to create the GraphQL schema.

```ts title="src/schemaComposer.ts"
// scr/schemaComposer.ts
import { schemaComposer } from '@ttoss/graphql-api';
import './modules/Module1/composer';
import './modules/Module3/composer';
import './modules/User/composer';

export { schemaComposer };
```

## Recommended Module Structure

As your GraphQL API grows, you'll encounter three recurring problems: circular imports between modules, relational fields hidden in resolver files (making TC files incomplete), and monolith resolver files with hundreds of lines. The structure below solves all three.

### Directory Structure

Each module has **TC files** at the root and a `resolvers/` folder with one file per GraphQL field:

```
src/modules/
├── Meta/
│   ├── index.ts                              # side-effect imports of all resolver files
│   ├── MetaAdAccountTC.ts                    # pure shape — scalars + string type refs
│   ├── MetaCampaignTC.ts
│   └── resolvers/
│       ├── Query.metaAdAccount.ts            # root query
│       ├── Mutation.addMetaAdAccounts.ts     # root mutation
│       ├── MetaAdAccount.optimizations.ts    # cross-module relational field
│       └── MetaCampaign.optimization.ts
├── Optimizations/
│   ├── index.ts
│   ├── OptimizationTC.ts
│   └── resolvers/
│       ├── Query.optimization.ts
│       ├── Mutation.createOptimization.ts
│       ├── Optimization.metaCampaign.ts      # cross-module relational field
│       └── Optimization.algorithm.ts
└── User/
    ├── index.ts
    ├── UserTC.ts
    └── resolvers/
        └── Query.me.ts
```

### Rule 1: TC Files — All Fields Declared with String Type References

TC files declare **all** fields (scalars and relational) but use **string type names** for cross-module types instead of importing other TCs. `schemaComposer` resolves string type names lazily when building the schema, eliminating circular imports and keeping the full type shape visible in one file.

```typescript
// MetaAdAccountTC.ts — no imports from other modules
import { schemaComposer } from '@ttoss/graphql-api';

export const MetaAdAccountTC = schemaComposer.createObjectTC({
  name: 'MetaAdAccount',
  fields: {
    id: 'ID!',
    name: 'String!',
    // String type ref — resolved lazily by schemaComposer at build time
    optimizations: '[Optimization!]!',
    tracking: 'MetaAdAccountTracking',
  },
});
```

### Rule 2: Resolver Files — One Field Per File with `extendField`

Each resolver file attaches the `resolve` function to a single field using `extendField`. Root queries and mutations use `schemaComposer.Query.addFields()` / `schemaComposer.Mutation.addFields()`.

```typescript
// resolvers/MetaAdAccount.optimizations.ts
import { schemaComposer } from '@ttoss/graphql-api';
import { MetaAdAccountTC } from '../MetaAdAccountTC';

MetaAdAccountTC.extendField('optimizations', {
  args: { isActive: 'Boolean' },
  resolve: async (source, args) => {
    return findManyOptimizations({
      metaAdAccountId: source.id,
      isActive: args.isActive,
    });
  },
});
```

```typescript
// resolvers/Query.metaAdAccount.ts
import { schemaComposer } from '@ttoss/graphql-api';

schemaComposer.Query.addFields({
  metaAdAccount: {
    type: 'MetaAdAccount',
    args: { id: 'ID!' },
    resolve: async (_source, args) => {
      return findMetaAdAccount({ id: args.id });
    },
  },
});
```

### Rule 3: Dot Notation File Naming

Resolver files use `Parent.field.ts` naming that maps 1:1 to the GraphQL schema path:

| File name                        | GraphQL path                             |
| -------------------------------- | ---------------------------------------- |
| `Query.metaAdAccount.ts`         | `metaAdAccount` field on `Query`         |
| `Mutation.createOptimization.ts` | `createOptimization` field on `Mutation` |
| `MetaAdAccount.optimizations.ts` | `optimizations` field on `MetaAdAccount` |

### Rule 4: Index Files — Side-Effect Imports

Each module's `index.ts` imports all TC and resolver files as side effects, guaranteeing registration order:

```typescript
// Meta/index.ts
import './MetaAdAccountTC';
import './MetaCampaignTC';
import './resolvers/Query.metaAdAccount';
import './resolvers/Mutation.addMetaAdAccounts';
import './resolvers/MetaAdAccount.optimizations';
import './resolvers/MetaCampaign.optimization';
```

The top-level `schemaComposer.ts` then imports each module index:

```typescript
// src/schemaComposer.ts
import { schemaComposer } from '@ttoss/graphql-api';
import './modules/Meta';
import './modules/Optimizations';
import './modules/User';

export { schemaComposer };
```

### Why This Works

| Concern                         | Solution                                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **No circular imports**         | TC files never import other module TCs. Only resolver files (leaf nodes) do cross-module imports, and nothing imports from them. |
| **Full shape visibility**       | The TC file shows every field on the type — scalars and relational — in one place.                                               |
| **Import order independence**   | String type refs are resolved lazily at `buildSchema()` time.                                                                    |
| **Easy to locate**              | `Parent.field.ts` maps 1:1 to the GraphQL schema path.                                                                           |
| **One responsibility per file** | Each resolver file handles exactly one field, keeping files small and focused.                                                   |

## Relay Server Specification

As ttoss uses Relay as the main GraphQL client, this library implements the [Relay Server Specification](https://relay.dev/docs/guides/graphql-server-specification/).

### Object Identification

Method `composeWithRelay` will handle the object identification for your `ObjectTypeComposer`, it will return a globally unique ID among all types in the following format `base64(TypeName + ':' + recordId)`.

Method `composeWithRelay` only works if `ObjectTypeComposer` meets the following requirements:

1. Has defined [`recordIdFn`](https://ttoss.dev/blog/2024/01/12/working-with-different-ids-through-the-application#record-id): returns the id for the [`globalId`](/blog/2024/01/12/working-with-different-ids-through-the-application#global-id) construction. For example, if you use DynamoDB, you could create id from hash and range keys:

   ```ts
   UserTC.setRecordIdFn((source) => {
     return `${source.hashKey}:${source.rangeKey}`;
   });
   ```

1. Have `findById` resolver: this resolver will be used by `RootQuery.node` to resolve the object by [`globalId`](/blog/2024/01/12/working-with-different-ids-through-the-application#global-id). Also, add the `__typename` field is required by Relay to know the type of the object to the `node` field works. For example:

   ```ts
   UserTC.addResolver({
     name: 'findById',
     type: UserTC,
     args: {
       id: 'String!',
     },
     resolve: ({ args }) => {
       const { type, recordId } = fromGlobalId(args.id);
       // find object
     },
   });
   ```

1. Call `composeWithRelay` method: this will add the `id` field and the `node` query. For example:

   ```ts
   composeWithRelay(UserTC);
   ```

#### Example

```ts
import {
  composeWithRelay,
  schemaComposer,
  fromGlobalId,
} from '@ttoss/graphql-api';

const UserTC = schemaComposer.createObjectTC({
  name: 'User',
  fields: {
    id: 'ID!',
    name: 'String!',
  },
});

/**
 * 1. Returns you id for the globalId construction.
 */
UserTC.setRecordIdFn((source) => {
  /**
   * If you use DynamoDB, you could create id from hash and range keys:
   * return `${source.hashKey}:${source.rangeKey}`;
   */
  return source.id;
});

/**
 * 2. Define `findById` resolver (that will be used by `RootQuery.node`).
 */
UserTC.addResolver({
  name: 'findById',
  type: UserTC,
  args: {
    id: 'String!',
  },
  resolve: async ({ args }) => {
    const { type, recordId } = fromGlobalId(args.id);
    const user = await query({ id: recordId });
    return {
      ...user,
      __typename: UserTC.getTypeName(), // or 'User';
    };
  },
});

/**
 * 3. This will add the `id` field and the `node` query.
 */
composeWithRelay(UserTC);
```

_We inspired ourselves on [graphql-compose-relay](https://graphql-compose.github.io/docs/plugins/plugin-relay.html) to create `composeWithRelay`._

### What Is a Node in Relay

In the [Relay Server Specification](https://relay.dev/docs/guides/graphql-server-specification/), a **Node** is any object that:

Has a **globally unique identity** across your entire GraphQL API.
Can be **fetched independently** using the `node(id: ID!)`: Node query.
Implements the `Node` interface.

Only types that are nodes should use `composeWithRelay`.

### When to Use `composeWithRelay` (i.e., When Is a Type a Node?)

| Condition                                                  | Must Be True |
| ---------------------------------------------------------- | ------------ |
| Has a unique record ID in your database or external system | Yes          |
| Can be refetched by ID from anywhere in the app            | Yes          |
| Clients may cache and reuse it via global ID               | Yes          |
| Appears nested inside other objects and also stands alone  | Yes          |

#### Not Nodes (Don't Use `composeWithRelay`):

Examples of types should **never** use `composeWithRelay`

```typescript
// Wrong - embedded objects
SubscriptionUpcomingInvoiceTC; // Only exists inside Subscription
PriceDetailsTC; // Embedded value object
MarketingFeatures; // Configuration data

// Wrong - computed values
UserFullNameTC; // Derived from firstName + lastName
OrderTotalTC; // Calculated from line items

// Wrong - transient data
ValidationErrorTC; // Temporary error state
SearchResultTC; // Query response wrapper
```

#### Why Embedded Objects Are Not Nodes

Consider this embedded object:

```typescript
type Subscription {
  upcomingInvoice: SubscriptionUpcomingInvoice
}
```

`SubscriptionUpcomingInvoice` should **not** use `composeWithRelay` because it fails the Node criteria:

**Missing Node Requirements:**

- No independent identity - exists only within its parent Subscription
- Cannot be refetched independently - no direct database record
- Not cached separately - lifecycle tied 1:1 to parent object
- Never queried directly - accessed only through parent

**Problems Created by `composeWithRelay`:**

- Generates meaningless global IDs for non-independent objects
- Pollutes the `node` interface with unfetchable objects
- Breaks Relay's cache normalization expectations
- Adds unnecessary complexity without any benefit

**Simple Test:** If you cannot write `node(id: "...")` to fetch this object independently, it should not be a Node.

### Connections

This package provides the method `composeWithConnection` to create a connection type and queries for a given type, based on [graphql-compose-connection](https://graphql-compose.github.io/docs/plugins/plugin-connection.html) plugin and following the [Relay Connection Specification](https://facebook.github.io/relay/graphql/connections.htm).

```typescript
import { composeWithConnection } from '@ttoss/graphql-api';

AuthorTC.addResolver({
  name: 'findMany',
  type: AuthorTC,
  resolve: async ({ args }) => {
    // find many
  },
});

composeWithConnection(AuthorTC, {
  findManyResolver: AuthorTC.getResolver('findMany'),
  countResolver: AuthorTC.getResolver('count'),
  sort: {
    ASC: {
      value: {
        scanIndexForward: true,
      },
      cursorFields: ['id'],
      beforeCursorQuery: (rawQuery, cursorData, resolveParams) => {
        if (!rawQuery.id) rawQuery.id = {};
        rawQuery.id.$lt = cursorData.id;
      },
      afterCursorQuery: (rawQuery, cursorData, resolveParams) => {
        if (!rawQuery.id) rawQuery.id = {};
        rawQuery.id.$gt = cursorData.id;
      },
    },
    DESC: {
      value: {
        scanIndexForward: false,
      },
      cursorFields: ['id'],
      beforeCursorQuery: (rawQuery, cursorData, resolveParams) => {
        if (!rawQuery.id) rawQuery.id = {};
        rawQuery.id.$gt = cursorData.id;
      },
      afterCursorQuery: (rawQuery, cursorData, resolveParams) => {
        if (!rawQuery.id) rawQuery.id = {};
        rawQuery.id.$lt = cursorData.id;
      },
    },
  },
});

schemaComposer.Query.addFields({
  authors: Authors.getResolver('connection'),
});
```

When you `composeWithConnection` a type composer, it will add the resolver `connection` to the type composer, so you can add to `Query` or any other type composer. For example:

```ts
schemaComposer.Query.addFields({
  authors: Authors.getResolver('connection'),
});
```

The resolver `connection` has the following arguments based on the [Relay Connection Specification](https://facebook.github.io/relay/graphql/connections.htm):

- `first`: the number of nodes to return.
- `after`: the cursor to start the query.
- `last`: the number of nodes to return.
- `before`: the cursor to start the query.
- `limit`: the limit of nodes to return. It's the `first` or `last` argument plus one. It's used to know if there are more nodes to return to set `hasNextPage` or `hasPreviousPage` [PageInfo](https://relay.dev/graphql/connections.htm#sec-undefined.PageInfo) fields. For example, if `first` is `10`, `limit` will be `11`. If the resolver returns `11` nodes, the resolver will return `10` but it knows there are more nodes to return, so `hasNextPage` will be `true`.
- `skip`: it's the `count` minus `last`. It only works on [backward pagination](https://relay.dev/graphql/connections.htm#sec-Backward-pagination-arguments).
- `sort`: the sort option to use. It's the `value` of the `sort` object. In our example, it's `{ scanIndexForward: true }` for `ASC` and `{ scanIndexForward: false }`, for `DESC`.
- `filter`: the filter to use. It'll exist if you add the `filter` to `findManyResolver` for example, the implementation below will add the `filter` argument with the `name` and `book` fields:

  ```ts
  AuthorTC.addResolver({
    name: 'findMany',
    type: AuthorTC,
    args: {
      filter: {
        name: 'String',
        book: 'String',
      },
    },
    resolve: async ({ args }) => {
      // find many
    },
  });
  ```

To configure `composeWithConnection`, you need to provide the following options:

#### `findManyResolver`

The resolver that will be used to find the nodes. It receives the following arguments:

- `args`: the `args` object from the resolver. Example:

  ```ts
  AuthorTC.addResolver({
    name: 'findMany',
    type: AuthorTC,
    args: {
      filter: {
        name: 'String',
        book: 'String',
      },
      // other args
    },
    resolve: async ({ args }) => {
      // find many
    },
  });
  ```

- `rawQuery`: an object created by `beforeCursorQuery` or `afterCursorQuery` methods from [sort](#sort) option.

#### `countResolver`

The resolver that will be used to count the nodes.

#### `sort`

It's an object that defines the sort options. Each key is the sort name and the value is an object with the following properties:

- `value`: and object that the `args` resolver will receive as the `sort` argument. It'll also be the values of the sort enum composer created (check the implementation details [here](https://github.com/graphql-compose/graphql-compose-connection/blob/master/src/types/sortInputType.ts).)
- `cursorFields`: an array of fields that will be used to create the cursor.
- `beforeCursorQuery` and `afterCursorQuery`: methods that will be used to create the `rawQuery` object for the `findManyResolver`. They receive the following arguments:
  - `rawQuery`: the `rawQuery` object that will be used to find the nodes.
  - `cursorData`: the data from the cursor define on `cursorFields`. For example, if you define `cursorFields` as `['id', 'name']`, the `cursorData` will an object with the `id` and `name` properties.
  - `resolveParams`: the `resolveParams` object from the resolver. You can access `args`, `context` and `info` and other GraphQL properties from this object.

  Example:

  ```ts
  composeWithConnection(AuthorTC, {
    // ...
    sort: {
      ASC: {
        // ...
        cursorFields: ['id', 'name'],
        // Called when `before` cursor is provided.
        beforeCursorQuery: (rawQuery, cursorData, resolveParams) => {
          if (!rawQuery.id) rawQuery.id = {};
          rawQuery.id.$lt = cursorData.id;
          rawQuery.name.$lt = cursorData.name;
        },
        // Called when `after` cursor is provided.
        afterCursorQuery: (rawQuery, cursorData, resolveParams) => {
          if (!rawQuery.id) rawQuery.id = {};
          rawQuery.id.$gt = cursorData.id;
          rawQuery.name.$gt = cursorData.name;
        },
      },
    },
  });
  ```

  In the example above, the `findManyResolver` will receive the following `rawQuery` object when `before` cursor is provided:

  ```json
  {
    "id": {
      "$lt": "id-from-cursor"
    },
    "name": {
      "$lt": "name-from-cursor"
    }
  }
  ```

### Middlewares

This package provides a way to add middlewares to your final schema. You can add middlewares compatible with [`graphql-middleware`](https://github.com/dimatill/graphql-middleware) by passing them to the `middlewares` option on `buildSchema` method. For example, you can use [GraphQL Shield](https://the-guild.dev/graphql/shield) to add authorization to your API:

```typescript
import { buildSchema } from '@ttoss/graphql-api';
import { allow, deny, shield } from '@ttoss/graphql-api/shield';
import { schemaComposer } from './schemaComposer';

const NotAuthorizedError = new Error('Not authorized!');
/**
 * The error name is the same value `errorType` on GraphQL errors response.
 */
NotAuthorizedError.name = 'NotAuthorizedError';

const permissions = shield(
  {
    Query: {
      '*': deny,
      author: allow,
    },
    Author: {
      id: allow,
      name: allow,
    },
  },
  {
    fallbackRule: deny,
    fallbackError: NotAuthorizedError,
  }
);

/**
 * Apply middlewares to all resolvers.
 */
const logInput = async (resolve, source, args, context, info) => {
  console.log(`1. logInput: ${JSON.stringify(args)}`)
  const result = await resolve(source, args, context, info)
  console.log(`5. logInput`)
  return result
}

/**
 * Apply middlewares only to a specific resolver.
 */
const logOnQueryMe = {
  Query: {
    me: logInput
  }
}

const schema = buildSchema({
  schemaComposer,
  middlewares; [permissions, logInput, logOnQueryMe],
})
```

#### Shield

This package re-exports the all methods from [GraphQL Shield](https://the-guild.dev/graphql/shield).

```typescript
import { allow, deny, shield } from '@ttoss/graphql-api/shield';
```

## Building Schema and Types

Check [@ttoss/graphql-api-cli](https://ttoss.dev/docs/modules/packages/graphql-api-cli/) for more information about how to build the schema and types.

## How to Create Tests

We recommend testing the whole GraphQL API using the `graphql` object and the schema composer to provide the schema. For example:

```ts
import { graphql } from 'graphql';
import { schemaComposer } from './schemaComposer';

test('testing my query', () => {
  const author = {
    id: '1',
    name: 'John Doe',
  };

  const response = await graphql({
    schema: schemaComposer.buildSchema(),
    source: /* GraphQL */ `
      query ($id: ID!) {
        node(id: $id) {
          id
          ... on Author {
            name
          }
        }
      }
    `,
    variableValues: {
      id: author.id,
    },
  });

  expect(response).toEqual({
    data: {
      node: {
        id: author.id,
        name: author.name,
      },
    },
  });
});
```
