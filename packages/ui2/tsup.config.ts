import { tsupConfig } from '@ttoss/config';

export const tsup = {
  ...tsupConfig(),
  entryPoints: ['src/index.ts', 'src/model.ts'],
  format: ['esm'],
  external: ['react', 'react-dom', 'react-aria-components', '@ttoss/theme2'],
};
