import type { Config } from 'jest';

import { configCreator } from './configCreator';

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */
export const defaultConfig: Config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'babel',
  /**
   * https://github.com/jestjs/jest/issues/13739#issuecomment-1517190965
   */
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  fakeTimers: {
    advanceTimers: true,
    enableGlobally: true,
  },
  /**
   * https://stackoverflow.com/a/64390115/8786986
   */
  moduleDirectories: ['node_modules', '<rootDir>/../..'],
  moduleNameMapper: {
    /**
     * Redirect .d.mts type declaration files to an empty module so Jest
     * doesn't try to execute ESM import statements in type-only files
     * accidentally bundled into dist output.
     */
    '\\.d\\.mts$': require.resolve('./__mocks__/emptyModule.cjs'),
    /**
     * Remove CSS import errors:
     *
     * Jest failed to parse a file. This happens e.g. when your code or its
     * dependencies use non-standard JavaScript syntax, or when Jest is not
     * configured to support such syntax.
     */
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  /**
   * Also transform .mjs and .cjs files with babel-jest. An ESM-only dist output
   * (e.g. @ttoss/config's chunk-*.mjs) is compiled to CJS for Jest's CommonJS
   * test environment. A published .cjs build may keep a dynamic `import()`
   * (e.g. @ttoss/appsync-api's lazy `@ttoss/i18n-core`), which that
   * environment cannot run without `--experimental-vm-modules`; Babel turns it
   * into a `require`.
   */
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
    '^.+\\.mjs$': 'babel-jest',
    '^.+\\.cjs$': 'babel-jest',
  },
  /**
   * Jest defaults to 5s, which is too tight for work that is deliberately
   * slow — password hashing at OWASP iteration counts, or `userEvent`
   * driving a component library — and produced CI timeouts that never
   * reproduced locally. This raises the ceiling rather than weakening any
   * assertion: a genuinely hung test still fails, just later. A package
   * needing more (see `@ttoss/fsl-bench`) overrides it, since the package
   * config wins the merge.
   */
  testTimeout: 30_000,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const jestConfig = configCreator<any>(defaultConfig);

export const jestRootConfig = configCreator({
  projects: ['<rootDir>/tests'],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const jestE2EConfig = configCreator<any>({
  ...defaultConfig,
  collectCoverage: false,
  displayName: 'E2E Tests',
  roots: ['<rootDir>'],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const jestUnitConfig = configCreator<any>({
  ...defaultConfig,
  displayName: 'Unit Tests',
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/../../src/**/*.{ts,tsx,js,jsx}',
    '!<rootDir>/../../src/**/*.d',
  ],
  roots: ['<rootDir>'],
});
