import { tsdownConfig } from '@ttoss/config';

export default tsdownConfig({
  entry: { index: 'tests/models/index.ts' },
  outDir: 'models/dist',
});
