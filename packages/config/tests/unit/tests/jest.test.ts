import {
  defaultConfig,
  jestConfig,
  jestE2EConfig,
  jestUnitConfig,
} from 'src/jest';

test('should return default config', () => {
  expect(jestConfig()).toEqual(defaultConfig);
});

test('should map css files in unit config', () => {
  const config = jestUnitConfig();
  expect(config.moduleNameMapper['\\.(css|less|scss|sass)$']).toBe(
    'identity-obj-proxy'
  );
});

test('should map css files in e2e config', () => {
  const config = jestE2EConfig();
  expect(config.moduleNameMapper['\\.(css|less|scss|sass)$']).toBe(
    'identity-obj-proxy'
  );
});

test('should raise testTimeout above the 5s jest default', () => {
  expect(defaultConfig.testTimeout).toBe(30_000);
  expect(jestUnitConfig().testTimeout).toBe(30_000);
  expect(jestE2EConfig().testTimeout).toBe(30_000);
});

test('should let a package override the default testTimeout', () => {
  expect(jestUnitConfig({ testTimeout: 120_000 }).testTimeout).toBe(120_000);
});

test('should transform .mjs and .cjs files, so a published build is compiled for Jest', () => {
  const { transform } = jestUnitConfig();
  expect(transform['^.+\\.mjs$']).toBe('babel-jest');
  expect(transform['^.+\\.cjs$']).toBe('babel-jest');
});

describe('JEST_COVERAGE', () => {
  const original = process.env.JEST_COVERAGE;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.JEST_COVERAGE;
    } else {
      process.env.JEST_COVERAGE = original;
    }
  });

  test('should collect coverage in unit config when unset', () => {
    delete process.env.JEST_COVERAGE;
    expect(jestUnitConfig().collectCoverage).toBe(true);
  });

  test('should turn coverage off in unit config when "false"', () => {
    process.env.JEST_COVERAGE = 'false';
    expect(jestUnitConfig().collectCoverage).toBe(false);
  });

  test('should keep coverage on for any other value', () => {
    process.env.JEST_COVERAGE = 'true';
    expect(jestUnitConfig().collectCoverage).toBe(true);
  });

  test('should let a package config override the environment', () => {
    process.env.JEST_COVERAGE = 'false';
    expect(jestUnitConfig({ collectCoverage: true }).collectCoverage).toBe(
      true
    );
  });

  test('should keep the rest of the unit config', () => {
    process.env.JEST_COVERAGE = 'false';
    expect(jestUnitConfig().displayName).toBe('Unit Tests');
  });
});
