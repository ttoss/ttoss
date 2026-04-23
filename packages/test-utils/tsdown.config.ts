import { tsdownConfig } from '@ttoss/config';

export default tsdownConfig({
  dts: {
    banner: '/// <reference types="@testing-library/jest-dom" />',
  },
  entry: [
    'src/index.ts',
    'src/faker.ts',
    'src/react.ts',
    'src/relay.ts',
    'src/storybook.ts',
  ],
});
