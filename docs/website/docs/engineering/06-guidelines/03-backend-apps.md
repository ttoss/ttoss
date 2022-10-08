---
title: Backend Apps
---

## Build

- Use [@ttoss/config](/docs/modules/packages/config/#tsup) to configure the build. Example:

  ```ts title="tsup.config.ts"
  import { Options } from 'tsup';

  export const tsup: Options = {
    platform: 'node',
  };
  ```

## Configuration

- Use [@ttoss/config](/docs/modules/packages/config/#typescript) to extend `tsconfig.json` on the package folder.
