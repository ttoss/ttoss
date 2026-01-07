import { tsupConfig } from '@ttoss/config';
import { defineConfig } from 'tsup';

export const tsup = defineConfig({
  ...tsupConfig(),
  format: ['esm'],
  /**
   * sequelize-typescript as noExternal doesn't work because it raises the
   * error: Error: Dynamic require of "sequelize" is not supported.
   */
  noExternal: [],
});
