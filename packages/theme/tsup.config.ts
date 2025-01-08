import { tsupConfig } from '@ttoss/config';

export const tsup = {
  ...tsupConfig(),
  entryPoints: [
    'src/index.ts',
    'src/themes/Bruttal/Bruttal.ts',
    'src/themes/Oca/Oca.ts',
  ],
  format: ['esm'],
};
