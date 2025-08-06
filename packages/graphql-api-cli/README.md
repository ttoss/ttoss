# @ttoss/graphql-api-cli

CLI tool that generates GraphQL schemas and TypeScript types from your [`@ttoss/graphql-api`](https://ttoss.dev/docs/modules/packages/graphql-api/) schema composer, enabling seamless integration with Relay and providing type safety for your GraphQL operations.

## Installation

```bash
pnpm add -D @ttoss/graphql-api-cli
```

## Core Functionality

This CLI is essential for GraphQL development workflows using the ttoss ecosystem, providing automated generation of:

- **GraphQL Schema (SDL)**: Creates `schema/schema.graphql` file required for Relay introspection queries
- **TypeScript Types**: Generates `schema/types.ts` with strongly-typed interfaces for your GraphQL schema
- **Development Integration**: Seamlessly integrates with your build pipeline and development workflow

The tool operates by importing your `schemaComposer.ts` file, extracting the schema definition, and generating both the SDL schema file and corresponding TypeScript types using GraphQL Code Generator.

## Basic Usage

```bash
ttoss-graphql-api build-schema
```

Add the build script to your `package.json` for easy integration:

```json
{
  "scripts": {
    "build-schema": "ttoss-graphql-api build-schema"
  }
}
```

This command:

1. Reads your `src/schemaComposer.ts` file
2. Bundles it using esbuild to resolve all dependencies
3. Extracts the schema definition using the schemaComposer
4. Generates `schema/schema.graphql` in SDL format
5. Creates `schema/types.ts` with TypeScript type definitions

## Command Options

### Schema Composer Directory (`-d`, `--directory`)

Specify a custom directory for your `schemaComposer.ts` file:

```bash
ttoss-graphql-api build-schema -d src/graphql
ttoss-graphql-api build-schema --directory tests
```

**Default:** `src`

### External Dependencies (`--external`)

Control which additional dependencies are marked as external during the bundling process:

```bash
ttoss-graphql-api build-schema --external graphql-compose,@aws-sdk/client-dynamodb
```

**Default behavior:** Automatically excludes all package.json dependencies (except workspace packages) and appends any specified external dependencies to this list. Workspace dependencies (those with `workspace:` prefix) are automatically excluded from external handling to prevent bundling issues in monorepo environments.

## Integration Examples

### Basic Project Structure

```
my-graphql-api/
├── schema/                   # Generated files
│   ├── schema.graphql        # SDL schema
│   └── types.ts              # TypeScript types
├── src/
│   ├── schemaComposer.ts     # Your schema definition
│   └── modules/              # GraphQL modules
└── package.json
```

### Schema Composer Example

```typescript
// src/schemaComposer.ts
import { schemaComposer } from '@ttoss/graphql-api';
import './modules/User/composer';
import './modules/Post/composer';

export { schemaComposer };
```

### Advanced Configuration

For complex projects requiring specific external handling:

```bash
# Custom directory with specific externals
ttoss-graphql-api build-schema \
  --directory src/api \
  --external graphql-compose,dataloader,aws-sdk
```

### CI/CD Integration

```json
{
  "scripts": {
    "build": "pnpm build-schema && pnpm compile",
    "build-schema": "ttoss-graphql-api build-schema",
    "dev": "pnpm build-schema && tsx watch server.ts"
  }
}
```

## Technical Details

**ESM Only**: This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c) and requires Node.js with ES modules support.

**Bundling Process**: Uses esbuild to bundle your schema composer and its dependencies, ensuring all imports are resolved correctly before schema extraction. Automatically excludes all package.json dependencies as external (except workspace packages), with support for additional external dependencies via the `--external` option.

**Workspace Dependencies**: Dependencies with `workspace:` prefix are automatically excluded from external handling to prevent TypeScript import errors in monorepo environments where workspace packages may export `.ts` files directly.

**Type Generation**: Leverages [@graphql-codegen/typescript](https://www.npmjs.com/package/@graphql-codegen/typescript) for precise TypeScript type generation with interface declarations and preserved naming conventions.

## Related Packages

- **[@ttoss/graphql-api](https://ttoss.dev/docs/modules/packages/graphql-api/)**: Core GraphQL API building library
- **[@ttoss/graphql-api-server](https://ttoss.dev/docs/modules/packages/graphql-api-server/)**: Local development server
- **[@ttoss/appsync-api](https://ttoss.dev/docs/modules/packages/appsync-api/)**: AWS AppSync integration
