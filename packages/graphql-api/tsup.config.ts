import { tsupConfig } from '@ttoss/config';

export const tsup = {
  ...tsupConfig({
    entryPoints: ['src/index.ts', 'src/shield.ts'],
  }),
};
