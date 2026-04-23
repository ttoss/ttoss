import { tsdownConfig } from '@ttoss/config';

export default tsdownConfig(
  {
    format: ['esm'],
  },
  {
    arrayMerge: 'overwrite',
  }
);
