import { tsdownConfig } from '@ttoss/config';

export default tsdownConfig({
  entry: ['src/index.ts', 'src/core/index.ts'],
  format: ['esm'],
});
