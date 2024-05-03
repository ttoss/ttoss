# @ttoss/read-config-file

This package is a simple utility to read a configuration file in multiple formats:

- .json
- .yaml / .yml
- .js
- .ts

This package is ESM only.

## Installation

```bash
pnpm add @ttoss/read-config-file
```

## Usage

```ts
import { readConfigFile, readConfigFileSync } from '@ttoss/read-config-file';

const config1 = await readConfigFile({ configFilePath: 'path/to/config.json' });

const config2 = readConfigFileSync({
  configFilePath: 'path/to/config.json',
});
```
