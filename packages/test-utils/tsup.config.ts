import { tsupConfig } from '@ttoss/config';

export const tsup = tsupConfig({
  entryPoints: [
    'src/faker.ts',
    'src/index.ts',
    'src/relay.ts',
    'src/storybook.ts',
  ],
});
