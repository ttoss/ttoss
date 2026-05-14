import { tsupConfig } from '@ttoss/config';

export const tsup = {
  ...tsupConfig(),
  format: ['esm'],
  dts: {
    compilerOptions: {
      noCheck: true,
    },
  },
};
