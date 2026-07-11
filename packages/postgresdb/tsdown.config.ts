import { tsdownConfig } from '@ttoss/config';

export default tsdownConfig({
  format: ['esm'],
  /**
   * sequelize-typescript as noExternal doesn't work because it raises the
   * error: Error: Dynamic require of "sequelize" is not supported.
   */
});
