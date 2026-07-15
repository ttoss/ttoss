import { tsupConfig } from '@ttoss/config';

export const tsup = {
  ...tsupConfig(),
  entryPoints: ['src/index.ts', 'src/semantics/index.ts'],
  format: ['esm'],
  external: ['react', 'react-dom', 'react-aria-components', '@ttoss/fsl-theme'],
};
