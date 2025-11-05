import { tsupConfig } from '@ttoss/config';

export const tsup = tsupConfig({
  dts: {
    banner: '/// <reference types="@testing-library/jest-dom" />',
  },
  entryPoints: [
    'src/index.ts',
    'src/faker.ts',
    'src/react.ts',
    'src/relay.ts',
    'src/storybook.ts',
  ],
});
