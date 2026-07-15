import { tsdownConfig } from '@ttoss/config';

export default tsdownConfig({
  entry: ['src/index.ts', 'src/semantics/index.ts'],
  format: ['esm'],
});
