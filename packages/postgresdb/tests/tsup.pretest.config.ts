import { tsupConfig } from '@ttoss/config';
import { defineConfig } from 'tsup';

export const tsup = defineConfig({
  ...tsupConfig(),
  format: ['esm'],
  entry: ['tests/models/index.ts'],
  outDir: 'tests/models/dist',
  legacyOutput: false,
});
