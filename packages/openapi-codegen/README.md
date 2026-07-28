# @ttoss/openapi-codegen

Generate an SDK-ready merged OpenAPI document and a CLI route manifest from a
directory of per-module OpenAPI spec files.

This package extracts the spec-merging and CLI-route-generation logic that
[SOAT](https://soat.ttoss.dev)'s `@soat/sdk` and `@soat/cli` packages use to
turn their per-module OpenAPI YAML files into a generated SDK client and a
generated CLI. It's generic: any project that authors one OpenAPI spec file
per resource/module can reuse it to generate its own SDK and CLI.

## Installation

```bash
pnpm add -D @ttoss/openapi-codegen
```

## `mergeOpenApiSpecs`

Merges every `.yaml`/`.yml` file in a directory into a single OpenAPI
document: `paths` are combined, `components` (`schemas`, `responses`,
`securitySchemes`, `parameters`) are combined (first file to define a name
wins on a collision), the first non-empty `servers` array found is kept, and
cross-file `$ref`s (e.g. `./widgets.yaml#/components/schemas/Widget`) are
rewritten to local refs (`#/components/schemas/Widget`) so the merged
document is self-contained.

```ts
import fs from 'node:fs';

import { mergeOpenApiSpecs } from '@ttoss/openapi-codegen';

const merged = mergeOpenApiSpecs({
  specsDir: './openapi/v1',
  info: { title: 'My API', version: '1.0.0' },
});

fs.writeFileSync('./merged-spec.json', JSON.stringify(merged, null, 2));
```

Feed the resulting file to a spec-to-client generator such as
[`@hey-api/openapi-ts`](https://heyapi.dev/) to produce a TypeScript SDK.

## `generateCliRouteManifest` / `renderCliRoutesSource`

Reads the same per-module spec files and builds a map from CLI command name
(kebab-case, derived from `operationId`) to the SDK service class, HTTP
method, path/query parameters, and request-body flags needed to dispatch and
document that command — without running any HTTP-client codegen.

```ts
import fs from 'node:fs';

import {
  generateCliRouteManifest,
  renderCliRoutesSource,
} from '@ttoss/openapi-codegen';

const routes = generateCliRouteManifest({
  specsDir: './openapi/v1',
  moduleDocsUrl: (moduleSlug) => `https://my-docs.dev/modules/${moduleSlug}`,
});

fs.writeFileSync('./src/generated/routes.ts', renderCliRoutesSource(routes));
```

A CLI entry point (e.g. built with [`commander`](https://www.npmjs.com/package/commander))
then reads `routes.ts` and dynamically calls the matching SDK service method
for each command.

### Naming conventions

By default, `operationId`s are converted to kebab-case commands
(`listWidgets` → `list-widgets`) and tags are converted to PascalCase service
class names (`AI Providers` → `AIProviders`). Pass `operationIdToCommand` and
`tagToClassName` to `generateCliRouteManifest` to use different conventions.

## Notes

- Spec files are read in sorted filename order, so which file wins a
  `components` naming collision is deterministic.
- A request body's `oneOf` variants are merged into one flag set; a field is
  only marked required when every variant requires it.
- This package does not generate the SDK client itself — it produces the
  merged spec that a client generator like `@hey-api/openapi-ts` consumes.
