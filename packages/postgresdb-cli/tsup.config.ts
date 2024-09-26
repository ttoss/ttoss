import { tsupConfig } from '@ttoss/config';

export const tsup = {
  ...tsupConfig(),
  format: ['esm'],
  entryPoints: ['src/cli.ts'],
};
