import { defineConfig } from 'tsup';
import pkg from './package.json';

const dependencies = Object.keys(pkg.dependencies || {});

const noExternal = dependencies
  /**
   * Exclude all dependencies that are not from @ttoss because they exports
   * a .ts file on `exports` field.
   */
  .filter((dep) => {
    return dep.startsWith('@ttoss/');
  })
  /**
   * @ttoss/config doesn't exports a .ts file.
   */
  .filter((dep) => {
    return dep !== '@ttoss/config';
  });

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  bundle: true,
  entry: ['src/index.ts'],
  format: 'esm',
  noExternal,
  treeshake: true,
});
