# @ttoss/graphql-api-cli

This package generates schema and TypeScript types for your GraphQL API.

## ESM Only

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

## Installation

```bash
pnpm add -D @ttoss/graphql-api-cli
```

## Usage

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

## Options

### `--directory`/`-d`

If your `schemaComposer` is in a different directory, you can pass the `--directory`/`-d` option to `ttoss-graphl-api build-schema` command:

```bash
ttoss-graphl-api build-schema -d tests
```

### `--external`

External dependencies to ignore during build. If you don't set this option, the `build-schema` command will use the `dependencies` from your `package.json` file.

```bash
ttoss-graphl-api build-schema --external graphql-compose,graphql
```
