import { tsdownConfig } from '@ttoss/config';

export default tsdownConfig(
  {
    format: ['esm'],
    noExternal: [],
  },
  {
    arrayMerge: 'overwrite',
  }
);
