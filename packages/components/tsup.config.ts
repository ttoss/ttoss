import { tsupConfig } from '@ttoss/config';

export const tsup = tsupConfig(
  {
    format: ['esm'],
  },
  {
    arrayMerge: 'overwrite',
  }
);
