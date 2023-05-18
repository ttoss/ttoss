# @ttoss/graphql-api

This package provides an opinionated way to create an GraphQL API using ttoss ecosystem modules. The main goal of this package is to provide a resilient way to create a complex GraphQL API to meet the following goals:

1. **Modular**: you can create your GraphQL API using modules, so you can reduce the complexity of a big GraphQL API.
1. **Relay**: ttoss uses Relay as the main GraphQL client, so this package implements the [Relay Server Specification](https://relay.dev/docs/guides/graphql-server-specification/).
1. **Build Schema**: as Relay needs an introspection query to work, this package provides a way to build the GraphQL schema by running `ttoss-graphl-api build-schema`.
1. **AppSync Support**: this package provides a way to create a GraphQL API that works with AWS AppSync, besides you can also create a local GraphQL API server.

## Installation

```bash
pnpm add @ttoss/graphql-api graphql
```

## Getting Started

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

## Building Schema

As Relay needs an introspection query to work, this package provides a way to build the GraphQL schema by running `ttoss-graphl-api build-schema`.

```bash
ttoss-graphl-api build-schema
```

## Server

This package provides a Koa server to run your GraphQL API. You can use the `createServer` method to create the server.

```ts
import { createServer } from '@ttoss/graphql-api/server';

const server = createServer({
  schemaComposer,
  graphiql: true,
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
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
