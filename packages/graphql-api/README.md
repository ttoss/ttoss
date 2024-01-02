# @ttoss/graphql-api

This package provides an opinionated way to create an GraphQL API using ttoss ecosystem modules. The main goal of this package is to provide a resilient way to create a complex GraphQL API to meet the following goals:

1. **Modular**: you can create your GraphQL API using modules, so you can reduce the complexity of a big GraphQL API.
1. **Relay**: ttoss uses Relay as the main GraphQL client, so this package implements the [Relay Server Specification](https://relay.dev/docs/guides/graphql-server-specification/).
1. **Build Schema**: as Relay needs an introspection query to work, this package provides a way to build the GraphQL schema by running `ttoss-graphl-api build-schema`.
1. **Build TypeScript Types**: this package provides a way to build the TypeScript types for your GraphQL schema by running `ttoss-graphl-api build-schema`.
1. **AppSync Support**: this package provides a way to create a GraphQL API that works with AWS AppSync, besides you can also create a local GraphQL API server.

## Installation

```bash
pnpm add @ttoss/graphql-api graphql
```

## Quickstart

This library uses [`graphql-compose`](https://graphql-compose.github.io/) to create the GraphQL schema. It re-export all the [`graphql-compose`](https://graphql-compose.github.io/) types and methods, so you can use it directly from this package.

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

### Resolvers

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

## Relay Server Specification

As ttoss uses Relay as the main GraphQL client, this library implements the [Relay Server Specification](https://relay.dev/docs/guides/graphql-server-specification/).

### Object Identification

Method `composeWithRelay` will handle the object identification for your `ObjectTypeComposer`, it will return a globally unique ID among all types in the following format `base64(TypeName + ':' + recordId)`.

Method `composeWithRelay` only works if `ObjectTypeComposer` meets the following requirements:

1. Has defined `recordIdFn`: returns the id for the globalId construction. For example, if you use DynamoDB, you could create id from hash and range keys:

   ```ts
   UserTC.setRecordIdFn((source) => {
     return `${source.hashKey}:${source.rangeKey}`;
   });
   ```

2. Have `findById` resolver: this resolver will be used by `RootQuery.node` to resolve the object by globalId. For example:

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
  resolve: ({ args }) => {
    const { type, recordId } = fromGlobalId(args.id);
    // find object
  },
});

/**
 * 3. This will add the `id` field and the `node` query.
 */
composeWithRelay(UserTC);
```

_We inspired ourselves on [graphql-compose-relay](https://graphql-compose.github.io/docs/plugins/plugin-relay.html) to create `composeWithRelay`._

### Connections

This packages provides the method `composeWithConnection` to create a connection type and queries for a given type, based on [graphql-compose-connection](https://graphql-compose.github.io/docs/plugins/plugin-connection.html) plugin and following the [Relay Connection Specification](https://facebook.github.io/relay/graphql/connections.htm).

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
    },
    resolve: async ({
      args,
    }: {
      args: {
        first?: number;
        after?: string;
        last?: number;
        before?: string;
        /**
         * It's the `first` or `last` argument plus one.
         */
        limit: number;
        /**
         * The `filter` argument, if provided on the query.
         */
        filter?: {
          name: string;
          book: string;
        };
        /**
         * The `sort` argument, if provided on the query as
         * they keys of the `sort` object. In our example
         * above, it's `ASC` and `DESC`. `scanIndexForward`
         * is the value of the `value` property on the sort
         * object. In our example above, it's `true` for
         * `ASC` and `false` for `DESC`.
         */
        sort: {
          scanIndexForward: boolean;
        };
      };
    }) => {
      //
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

const schema = buildSchema({
  schemaComposer,
  middlewares; [permissions],
})
```

#### Shield

This package re-exports the all methods from [GraphQL Shield](https://the-guild.dev/graphql/shield).

```typescript
import { allow, deny, shield } from '@ttoss/graphql-api/shield';
```

## Building Schema and Types

As Relay needs an introspection query to work, this package provides a way to build the GraphQL schema by running `ttoss-graphl-api build-schema`. It build the schema using the `schemaComposer` from `src/schemaComposer.ts` file and save the schema in `schema/schema.graphql` file and TypeScript types in `schema/types.ts` file.

```bash
ttoss-graphl-api build-schema
```

You can add the `build-schema` script to your `package.json`:

```json
{
  "scripts": {
    "build-schema": "ttoss-graphl-api build-schema"
  }
}
```

If your `schemaComposer` is in a different directory, you can pass the `--directory`/`-d` option to `ttoss-graphl-api build-schema` command:

```bash
ttoss-graphl-api build-schema -d tests
```

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
