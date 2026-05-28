import { tsdownConfig } from '@ttoss/config';

export const tsdown = {
  ...tsdownConfig(),
  entry: [
    'src/index.ts',
    'src/themes/Bruttal/Bruttal.ts',
    'src/themes/Oca/Oca.ts',
  ],
  format: ['esm'],
};
