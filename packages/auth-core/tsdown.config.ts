import { tsdownConfig } from '@ttoss/config';

export const tsdown = tsdownConfig({
  entry: ['src/index.ts', 'src/AmazonCognito/index.ts'],
});
