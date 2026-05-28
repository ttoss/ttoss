import { tsdownConfig } from '@ttoss/config';
import { defineConfig } from 'tsdown';

export const tsdown = defineConfig({
  ...tsdownConfig(),
  format: ['esm'],
  /**
   * sequelize-typescript as noExternal doesn't work because it raises the
   * error: Error: Dynamic require of "sequelize" is not supported.
   */
});
