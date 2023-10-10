import { jestConfig } from '@ttoss/config';

const config = jestConfig({
  setupFilesAfterEnv: ['./tests/setupTests.tsx'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    'react-markdown': [
      '<rootDir>/../../node_modules/react-markdown/react-markdown.min.js',
      '<rootDir>/node_modules/react-markdown/react-markdown.min.js',
    ],
    'hast-util-raw': '<rootDir>/node_modules/hast-util-raw/lib/index.js',
    // 'rehype-raw': [
    //   '<rootDir>/../../node_modules/hast-util-raw/index.js',
    //   '<rootDir>/node_modules/hast-util-raw/index.js',
    // ],
    // 'rehype-raw': ['<rootDir>/../../node_modules/rehype-raw/index.js'],
  },
});

// eslint-disable-next-line import/no-default-export
export default config;
