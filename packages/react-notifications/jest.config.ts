import { jestConfig } from '@ttoss/config';

const config = jestConfig({
  setupFilesAfterEnv: ['./tests/setupTests.tsx'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    'react-markdown': [
      '<rootDir>/node_modules/@ttoss/components/node_modules/react-markdown/react-markdown.min.js',
    ],
  },
});

// eslint-disable-next-line import/no-default-export
export default config;
