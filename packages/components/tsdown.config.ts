import { tsdownConfig } from '@ttoss/config';

export default tsdownConfig(
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: {
      compilerOptions: {
        noCheck: true,
      },
    },
  },
  { arrayMerge: 'overwrite' }
);
