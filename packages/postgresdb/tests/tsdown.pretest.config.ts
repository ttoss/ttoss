import { tsdownConfig } from '@ttoss/config';
import { defineConfig } from 'tsdown';

export const tsdown = defineConfig({
  ...tsdownConfig(),
  format: ['esm'],
  entry: ['tests/models/index.ts'],
  outDir: 'tests/models/dist',
});
