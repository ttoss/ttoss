import { tsupConfig } from '@ttoss/config';

export const tsup = tsupConfig(
  {
    entryPoints: ['src/index.ts', 'src/plopfile.ts'],
    format: ['esm'],
  },
  {
    arrayMerge: 'overwrite',
  }
);
