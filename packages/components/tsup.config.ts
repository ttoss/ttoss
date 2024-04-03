import { tsupConfig } from '@ttoss/config';

export const tsup = tsupConfig(
  {
    entryPoints: ['src/index.ts', 'src/components/Table.tsx'],
    format: ['esm'],
  },
  {
    arrayMerge: 'overwrite',
  }
);
