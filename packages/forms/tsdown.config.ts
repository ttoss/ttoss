import { tsdownConfig } from '@ttoss/config';

export default tsdownConfig(
  {
    entry: [
      'src/index.ts',
      'src/MultistepForm/index.ts',
      'src/Brazil/index.ts',
    ],
    format: ['esm'],
  },
  {
    arrayMerge: 'overwrite',
  }
);
