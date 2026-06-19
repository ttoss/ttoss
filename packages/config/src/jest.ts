import type { Config } from 'jest';

import { configCreator } from './configCreator';

/**
 * SWC options used by `@swc/jest` to transform TS/JS/JSX for the test
 * environment. SWC replaces Babel here because ~85–96% of a suite's
 * wall-clock time was Babel transform + worker startup, not test execution.
 *
 * Notes on the equivalences with the previous Babel pipeline:
 *
 * - `react.runtime: 'automatic'` mirrors `@babel/preset-react`'s automatic
 *   runtime (no need to import React in scope).
 * - `legacyDecorator` + `decoratorMetadata` mirror
 *   `@babel/plugin-proposal-decorators` (version: 'legacy') and TypeScript's
 *   `emitDecoratorMetadata`, required by packages using decorators (e.g.
 *   Sequelize models in `@ttoss/postgresdb`).
 * - The `@swc/plugin-formatjs` experimental plugin mirrors
 *   `babel-plugin-formatjs`, generating stable message ids for
 *   `defineMessages` so i18n keeps working in tests.
 * - `import.meta` (used by full-ESM packages such as carlin /
 *   `@ttoss/cloudformation`) is handled natively by SWC's CommonJS module
 *   transform, replacing `babel-plugin-transform-import-meta`.
 * - `module.type: 'commonjs'` makes SWC emit CJS for Jest's CommonJS test
 *   environment, including the ESM-only `.mjs` dist outputs (e.g.
 *   `@ttoss/config`'s `chunk-*.mjs`) that were previously handled by
 *   `babel-jest`.
 */
const createSwcTransform = ({
  formatjs,
}: {
  formatjs: boolean;
}): [string, Record<string, unknown>] => {
  return [
    '@swc/jest',
    {
      /**
       * Emit source maps as a separate object (not inline) so `@swc/jest`
       * forwards them to Jest. The V8 coverage provider needs these maps to
       * map executed output back to the original TS/JSX sources.
       */
      sourceMaps: true,
      jsc: {
        target: 'es2022',
        parser: {
          syntax: 'typescript',
          tsx: true,
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
          react: {
            runtime: 'automatic',
          },
        },
        experimental: {
          plugins: formatjs
            ? [
                [
                  /**
                   * SWC resolves wasm plugin paths relative to the current
                   * working directory, not this package, so the bare specifier
                   * must be resolved to an absolute path for consumer packages
                   * to find it.
                   */
                  require.resolve('@swc/plugin-formatjs'),
                  {
                    idInterpolationPattern: '[sha512:contenthash:base64:6]',
                    ast: true,
                  },
                ],
              ]
            : [],
        },
      },
      module: {
        type: 'commonjs',
      },
    },
  ];
};

/**
 * Transform for first-party source. Includes the formatjs plugin to generate
 * stable message ids for `defineMessages`.
 */
const swcTransform = createSwcTransform({ formatjs: true });

/**
 * Transform for `node_modules` dependencies that Jest is configured to
 * compile (e.g. ESM-only packages enabled via `transformIgnorePatterns`).
 * The formatjs plugin is intentionally omitted here: it cannot statically
 * evaluate the dynamic `defineMessages`/`formatMessage` calls inside
 * third-party sources (e.g. `react-intl`) and would throw. This mirrors the
 * previous Babel config, which scoped the formatjs plugin with
 * `overrides: [{ exclude: /node_modules/ }]`.
 */
const swcTransformDependencies = createSwcTransform({ formatjs: false });

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */
export const defaultConfig: Config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  /**
   * SWC does not ship Babel's coverage instrumentation, so coverage is
   * collected through V8 (Node's native coverage) instead of the `babel`
   * provider.
   */
  coverageProvider: 'v8',
  fakeTimers: {
    advanceTimers: true,
    enableGlobally: true,
  },
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
   * Transform TS/JS/JSX and ESM-only `.mjs` outputs with `@swc/jest`, which
   * compiles them to CJS for Jest's CommonJS test environment.
   *
   * Jest uses the first matching pattern, so the `node_modules` rule must come
   * first to keep the formatjs plugin away from third-party sources. `.mjs`
   * files (ESM-only dist outputs and dependencies) also skip formatjs because
   * published dist already has message ids injected at build time.
   */
  transform: {
    '[/\\\\]node_modules[/\\\\].+\\.(mjs|[jt]sx?)$': swcTransformDependencies,
    '^.+\\.[jt]sx?$': swcTransform,
    '^.+\\.mjs$': swcTransformDependencies,
  },
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
  /**
   * https://stackoverflow.com/a/64390115/8786986
   */
  moduleDirectories: ['node_modules', '<rootDir>/../..'],
  roots: ['<rootDir>'],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const jestUnitConfig = configCreator<any>({
  ...defaultConfig,
  displayName: 'Unit Tests',
  collectCoverage: true,
  /**
   * `rootDir` points at the package root (the config lives in
   * `tests/unit/`). The V8 coverage provider only reports files located
   * **inside** `rootDir`, so `rootDir` must sit above `src/` — otherwise
   * coverage comes back empty. With the previous Babel provider the source
   * files could live above `rootDir`, but V8 cannot instrument them there.
   */
  rootDir: '../..',
  roots: ['<rootDir>/tests/unit'],
  /**
   * https://stackoverflow.com/a/64390115/8786986
   */
  moduleDirectories: ['node_modules', '<rootDir>'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{ts,tsx,js,jsx}',
    '!<rootDir>/src/**/*.d',
  ],
});
