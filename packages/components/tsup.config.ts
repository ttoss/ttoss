import { tsupConfig } from '@ttoss/config';

export const tsup = tsupConfig(
  {
    entryPoints: [
      'src/index.ts',
      'src/components/Table.tsx',
      'src/components/List/index.ts',
    ],
    format: ['esm'],
  },
  {
    arrayMerge: 'overwrite',
  }
);
