import { defineConfig } from 'tsdown';

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

export default defineConfig({
  dts: true,
  entry: ['src/index.ts', 'src/defineConfig.ts'],
  format: 'esm',
  noExternal,
  target: 'es2024',
  treeshake: true,
  clean: false,
});
