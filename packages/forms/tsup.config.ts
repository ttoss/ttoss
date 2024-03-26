import { tsupConfig } from '@ttoss/config';

export const tsup = tsupConfig({
  entryPoints: [
    'src/index.ts',
    'src/MultistepForm/index.ts',
    'src/Brazil/index.ts',
  ],
});
