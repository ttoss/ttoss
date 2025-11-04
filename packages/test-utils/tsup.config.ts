import { tsupConfig } from '@ttoss/config';

export const tsup = tsupConfig({
  dts: {
    banner: '/// <reference types="@testing-library/jest-dom" />',
  },
  entryPoints: [
    'src/faker.ts',
    'src/index.ts',
    'src/relay.ts',
    'src/storybook.ts',
  ],
});
