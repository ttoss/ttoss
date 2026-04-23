import { tsdownConfig } from '@ttoss/config';

export default tsdownConfig(
  {
    dts: false,
    format: 'cjs',
  },
  {
    arrayMerge: 'overwrite',
  }
);
