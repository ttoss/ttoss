import { tsdownConfig } from '@ttoss/config';

export default tsdownConfig(
  {
    format: ['esm'],
    entry: ['tests/models/index.ts'],
    outDir: 'tests/models/dist',
  },
  {
    arrayMerge: 'overwrite',
  }
);
