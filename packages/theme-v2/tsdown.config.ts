import { tsdownConfig } from '@ttoss/config';

export default tsdownConfig(
  {
    entry: [
      'src/index.ts',
      'src/css.ts',
      'src/runtime-entry.ts',
      'src/react.tsx',
      'src/vars.ts',
      'src/dtcg.ts',
      'src/dataviz/index.ts',
    ],
    format: ['esm'],
    inputOptions: {
      external: ['react'],
    },
  },
  {
    arrayMerge: 'overwrite',
  }
);
