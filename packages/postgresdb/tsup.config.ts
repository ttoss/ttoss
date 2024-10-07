import { defineConfig } from 'tsup';
import { tsupConfig } from '@ttoss/config';

export const tsup = defineConfig({
  ...tsupConfig(),
  format: ['esm'],
});
