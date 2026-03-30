import { tsupConfig } from '@ttoss/config';

export const tsup = {
  ...tsupConfig(),
  entryPoints: ['src/index.ts', 'src/react.tsx', 'src/dataviz/index.ts'],
  format: ['esm'],
  external: ['react'],
};
