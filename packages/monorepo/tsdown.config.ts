import { tsdownConfig } from '@ttoss/config';

export default tsdownConfig(
  {
    format: ['cjs'],
  },
  {
    arrayMerge: 'overwrite',
  }
);
