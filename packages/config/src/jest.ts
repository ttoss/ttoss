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
  /**
   * https://github.com/jestjs/jest/issues/13739#issuecomment-1517190965
   */
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
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
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const jestConfig = configCreator<any>(defaultConfig);
