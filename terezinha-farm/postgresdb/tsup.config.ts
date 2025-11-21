import { tsupConfig } from '@ttoss/config';
import { Options } from 'tsup';

export const tsup: Options = tsupConfig({
  entryPoints: ['src/index.ts'],
});
