import { tsupConfig } from '@ttoss/config';

export const tsup = tsupConfig(
  {
    entryPoints: [
      'src/index.ts',
      'src/components/Table.tsx',
      'src/components/List.tsx',
    ],
    format: ['esm'],
  },
  {
    arrayMerge: 'overwrite',
  }
);
