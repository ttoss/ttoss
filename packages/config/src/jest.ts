import { configCreator } from './configCreator';

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */
export const defaultConfig = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  moduleNameMapper: {
    '\\.(css)$': 'identity-obj-proxy',
  },
  fakeTimers: {
    enableGlobally: true,
  },
};

export const jestConfig = configCreator<any>(defaultConfig);
