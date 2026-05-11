import { tsupConfig } from '@ttoss/config';

export const tsup = {
  ...tsupConfig(),
  entryPoints: [
    'src/index.ts',
    'src/css.ts',
    'src/runtime-entry.ts',
    'src/react.tsx',
    'src/vars.ts',
    'src/dtcg.ts',
    'src/dataviz/index.ts',
    'src/themes/bruttal.ts',
    'src/themes/corporate.ts',
    'src/themes/ventures.ts',
    'src/themes/oca.ts',
  ],
  format: ['esm'],
  external: ['react'],
};
