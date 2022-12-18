import { tsupConfig } from '@ttoss/config';

export const tsup = tsupConfig({
  dts: false,
  format: 'cjs',
});
