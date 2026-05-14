# @ttoss/read-config-file

Read configuration files in Node.js with async or sync APIs.

Supported formats:

- .json
- .yaml / .yml
- .js
- .ts

## ESM Only

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

## Installation

```bash
pnpm add @ttoss/read-config-file
```

## Usage

```ts
import { readConfigFile, readConfigFileSync } from '@ttoss/read-config-file';

// Async API
const config1 = await readConfigFile({ configFilePath: 'path/to/config.json' });

// Sync API
const config2 = readConfigFileSync({
  configFilePath: 'path/to/config.json',
});
```

## TypeScript Config Files

When reading `.ts` files, this package bundles the entry with esbuild and then
loads the generated output synchronously. If your config exports a function,
the `options` object is passed to it.

```ts
const config = await readConfigFile({
  configFilePath: 'path/to/config.ts',
  options: { stage: 'dev' },
});
```

## Notes

- `readConfigFile` supports async config functions.
- `readConfigFileSync` is useful for synchronous CLI bootstrap.
