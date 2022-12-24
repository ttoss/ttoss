import { configCreator } from './configCreator';
// import type { Config } from 'jest';

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */
export const defaultConfig = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  fakeTimers: {
    enableGlobally: true,
  },
  moduleNameMapper: {
    /**
     * Remove CSS import errors:
     *
     * Jest failed to parse a file. This happens e.g. when your code or its
     * dependencies use non-standard JavaScript syntax, or when Jest is not
     * configured to support such syntax.
     */
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
    },
  ],
};

export const jestConfig = configCreator<any>(defaultConfig);
