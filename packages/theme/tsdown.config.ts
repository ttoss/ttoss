import { tsdownConfig } from '@ttoss/config';

export default tsdownConfig(
  {
    entry: [
      'src/index.ts',
      'src/themes/Bruttal/Bruttal.ts',
      'src/themes/Oca/Oca.ts',
    ],
    format: ['esm'],
  },
  {
    arrayMerge: 'overwrite',
  }
);
