import { tsdownConfig } from '@ttoss/config';

export const tsdown = {
  ...tsdownConfig(),
  format: ['esm'],
  dts: {
    compilerOptions: {
      noCheck: true,
    },
  },
};
