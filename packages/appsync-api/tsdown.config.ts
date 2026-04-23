import { tsdownConfig } from '@ttoss/config';

export default tsdownConfig({
  entry: ['src/index.ts'],
  noExternal: ['carlin'],
});
