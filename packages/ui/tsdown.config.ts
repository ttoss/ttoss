import { tsdownConfig } from '@ttoss/config';

export default tsdownConfig({
  format: ['esm'],
  dts: {
    compilerOptions: {
      noCheck: true,
    },
  },
});
