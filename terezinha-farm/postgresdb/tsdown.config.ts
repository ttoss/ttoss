import { tsdownConfig } from '@ttoss/config';
import type { Options } from 'tsdown';

export const tsdown: Options = tsdownConfig({
  entry: ['src/index.ts'],
});
