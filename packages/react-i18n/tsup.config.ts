import { tsupConfig } from '@ttoss/config';

export const tsup = tsupConfig({
  inject: ['./tsup.inject.js'],
});
