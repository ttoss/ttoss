import { tsupConfig } from '@ttoss/config';

export const tsup = tsupConfig({
  noExternal: ['@ttoss/cloud-auth'],
});
