import path from 'node:path';

import { readConfigFileSync } from '@ttoss/read-config-file';
import { defineConfig, requiredEnv } from 'src/defineConfig';

afterEach(() => {
  delete process.env.CARLIN_DEFINE_CONFIG_SECRET;
  delete process.env.CARLIN_REQUIRED_ENV_TEST;
});

test('defineConfig should preserve object config', () => {
  const config = defineConfig({
    lambdaFormat: 'cjs',
    parameters: {
      DomainName: 'api.example.com',
    },
  });

  expect(config).toEqual({
    lambdaFormat: 'cjs',
    parameters: {
      DomainName: 'api.example.com',
    },
  });
});

test('defineConfig should pass context to config functions', () => {
  const config = defineConfig(({ environment, project }) => {
    return {
      project,
      parameters: {
        DomainName: `${environment}.example.com`,
      },
    };
  });

  expect(
    config({ environment: 'Staging', project: 'oneclickads' })
  ).toMatchObject({
    project: 'oneclickads',
    parameters: {
      DomainName: 'Staging.example.com',
    },
  });
});

test('defineConfig should validate missing parameter values', () => {
  expect(() => {
    defineConfig({
      parameters: {
        DomainName: undefined,
      },
    });
  }).toThrow('config.parameters.DomainName must have a value.');
});

test('defineConfig should allow previous CloudFormation parameter values', () => {
  expect(() => {
    defineConfig({
      parameters: [
        {
          key: 'DatabasePassword',
          usePreviousValue: true,
        },
      ],
    });
  }).not.toThrow();
});

test('requiredEnv should return environment variable value', () => {
  process.env.CARLIN_REQUIRED_ENV_TEST = 'secret-value';

  expect(requiredEnv({ name: 'CARLIN_REQUIRED_ENV_TEST' })).toBe(
    'secret-value'
  );
});

test('requiredEnv should throw when environment variable is missing', () => {
  expect(() => {
    requiredEnv({ name: 'CARLIN_REQUIRED_ENV_TEST' });
  }).toThrow('Missing required environment variable: CARLIN_REQUIRED_ENV_TEST');
});

test('readConfigFileSync should load carlin/config subpath imports', () => {
  process.env.CARLIN_DEFINE_CONFIG_SECRET = 'secret-value';

  const configFilePath = path.resolve(
    __dirname,
    '../fixtures/config/typedCarlin.ts'
  );

  const config = readConfigFileSync({
    configFilePath,
    options: {
      environment: 'Production',
      project: 'oneclickads',
    },
  });

  expect(config).toEqual({
    project: 'oneclickads',
    parameters: {
      DomainName: 'Production.example.com',
      SecretValue: 'secret-value',
    },
  });
});
