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

A `$ref` into a file that is not in `specsDir` — a shared components file —
pulls the component it names into the merged document, together with whatever
that component refs in turn, so the rewritten local ref has something to point
at. `schemas`, `responses` and `parameters` can be pulled; a cross-file ref
naming anything else, a file that is not there, a component that file does not
declare, or a remote document is rejected rather than rewritten into a
dangling ref. A pulled component keeps its name, so a name a different
definition already holds is an error: the ref that lost would otherwise point
at the definition that won.

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
method, parameters, and request-body flags needed to dispatch and document
that command — without running any HTTP-client codegen.

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

### Parameters

Every OpenAPI parameter location becomes a CLI flag: `path`, `query`,
`header`, and `cookie`. Each `Route` also lists the parameter names per
location (`pathParams`, `queryParams`, `headerParams`, `cookieParams`) so the
CLI entry point knows where to send each value. Path parameters default to
required; every other location defaults to optional unless the spec says
`required: true`.

A parameter a spec declares must always reach the CLI, so
`generateCliRouteManifest` throws — rather than dropping the parameter — when
it meets one it cannot turn into a flag: a `$ref` it cannot resolve, or an
`in` value that is not one of the four locations above. Silently dropping
either would leave the flag missing from `--help` with nothing to explain why.

### Flag types

Every flag carries the JSON `type` its schema names, so the CLI knows which
values to parse as JSON before sending them. A schema that constrains the
value to no single type is typed `unknown` (exported as `UNKNOWN_FLAG_TYPE`)
rather than guessed as `string`: in OpenAPI 3.0 an absent `type` means
unconstrained — 3.0 has no union `type`, so every `oneOf`/`anyOf` schema omits
it — and `string` is the one type a CLI must _not_ parse as JSON, so guessing
it would send an object flag to the server as text and leave the manifest
unable to say whether the spec really asked for a string.

`$ref`s and composition keywords are read through first: a union whose members
all agree takes their type, and an `allOf` takes the type of the member that
names one. As with parameters, a schema `$ref` that cannot be resolved throws,
naming the spec that wrote it and what was missing, rather than silently
degrading the flag it types.

### Shared components across files

A `$ref` may name another file — `./common.yaml#/components/schemas/Metadata`
— and is read relative to the spec that wrote it, so a shared components file
can point at a third file of its own. Refs are followed across files wherever
they appear: a path or operation parameter, a request body, a body property, a
`oneOf` member. Each file is parsed once per run, however many specs point
into it.

The pointer has to name a component — `#/components/schemas/...` or
`#/components/parameters/...`. A ref to a whole file, to anything outside
`components`, or to a remote document is rejected rather than half-resolved.

The same layout feeds the merged SDK document: `mergeOpenApiSpecs` pulls a
referenced file's components in rather than leaving the ref dangling.

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
