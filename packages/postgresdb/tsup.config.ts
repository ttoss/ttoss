import { defineConfig } from 'tsup';
import { tsupConfig } from '@ttoss/config';

export const tsup = defineConfig({
  ...tsupConfig(),
  format: ['esm'],
  /**
   * sequelize-typescript as noExternal doesn't work because it raises the
   * error: Error: Dynamic require of "sequelize" is not supported.
   */
  noExternal: [],
});
