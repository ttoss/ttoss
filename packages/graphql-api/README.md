# @ttoss/graphql-api

This package provides an opinionated way to create an GraphQL API using ttoss ecosystem modules. The main goal of this package is to provide a simple way to create a complex GraphQL API and retrieve the SDL.

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

## Advanced

### Relay Wrapper

As ttoss uses Relay as the main GraphQL client, you can wrap your types with the `composeWithRelay` method to add the `id` field and the `node` query.

```ts
import { composeWithRelay, schemaComposer } from '@ttoss/graphql-api';

const UserTC = schemaComposer.createObjectTC({
  name: 'ProficiencyTest',
  fields: {
    id: 'ID!',
    name: 'String!',
  },
});

// 1. Returns you id for the globalId construction.
UserTC.setRecordIdFn((source) => {
  return source.id;
});

// 2. Define `findById` resolver (that will be used by `RootQuery.node`).
UserTC.addResolver({
  name: 'findById',
  type: UserTC,
  args: {
    id: 'String!',
  },
  resolve: // find user by id resolver
});

// 3. Apply Relay properties to the UserTC
composeWithRelay(UserTC);
```
