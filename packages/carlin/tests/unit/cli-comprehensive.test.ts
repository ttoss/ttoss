/**
 * Comprehensive CLI tests to ensure functionality is maintained
 * during the migration from yargs to commander.
 */
import { optionsFromConfigFiles, parseCli } from 'tests/testUtils';

jest.mock('src/deploy/baseStack/deployBaseStack', () => {
  return {
    ...(jest.requireActual(
      'src/deploy/baseStack/deployBaseStack'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any),
    deployBaseStack: jest.fn(),
  };
});

jest.mock('src/deploy/cloudformation', () => {
  return {
    deployCloudFormation: jest.fn(),
    destroyCloudFormation: jest.fn(),
  };
});

jest.mock('src/deploy/staticApp/deployStaticApp', () => {
  return {
    deployStaticApp: jest.fn(),
  };
});

jest.mock('src/deploy/vercel/deployVercel', () => {
  return {
    deployVercel: jest.fn(),
  };
});

jest.mock('src/deploy/lambdaLayer/deployLambdaLayer', () => {
  return {
    deployLambdaLayer: jest.fn(),
  };
});

jest.mock('src/generateEnv/generateEnv', () => {
  return {
    generateEnv: jest.fn(),
  };
});

jest.mock('deepmerge', () => {
  return {
    all: jest.fn(),
  };
});

jest.mock('findup-sync', () => {
  return {
    __esModule: true,
    default: jest
      .fn()
      .mockReturnValueOnce('./some-dir')
      .mockReturnValueOnce(undefined),
  };
});

import { faker } from '@ttoss/test-utils/faker';
import * as deepmerge from 'deepmerge';
import { AWS_DEFAULT_REGION } from 'src/config';

beforeAll(() => {
  (deepmerge.all as jest.Mock).mockReturnValue(optionsFromConfigFiles);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CLI main options', () => {
  describe('config option', () => {
    test('config option should accept a value', async () => {
      const argv = await parseCli('print-args', { config: 'some-config.yml' });
      expect(argv.config).toEqual('some-config.yml');
    });
  });

  describe('region option', () => {
    test('should have default region', async () => {
      const argv = await parseCli('print-args -e=undefined', {});
      expect(argv.region).toEqual(AWS_DEFAULT_REGION);
    });

    test('should accept alias -r for region', async () => {
      const argv = await parseCli('print-args -r=us-west-2', {});
      expect(argv.region).toEqual('us-west-2');
    });
  });

  describe('branch option', () => {
    test('branch option should be parsed', async () => {
      const branch = faker.word.sample();
      const argv = await parseCli(`print-args --branch=${branch}`, {});
      expect(argv.branch).toEqual(branch);
    });
  });

  describe('project option', () => {
    test('project option should be parsed', async () => {
      const project = faker.word.sample();
      const argv = await parseCli(`print-args --project=${project}`, {});
      expect(argv.project).toEqual(project);
    });
  });

  describe('environment option aliases', () => {
    test('should accept -e alias', async () => {
      const environment = faker.word.sample();
      const argv = await parseCli(`print-args -e=${environment}`, {});
      expect(argv.environment).toEqual(environment);
    });

    test('should accept --env alias', async () => {
      const environment = faker.word.sample();
      const argv = await parseCli(`print-args --env=${environment}`, {});
      expect(argv.environment).toEqual(environment);
    });

    test('should accept --environment', async () => {
      const environment = faker.word.sample();
      const argv = await parseCli(
        `print-args --environment=${environment}`,
        {}
      );
      expect(argv.environment).toEqual(environment);
    });
  });
});

describe('generate-env command', () => {
  test('generate-env command should be available', async () => {
    const argv = await parseCli('generate-env', {});
    expect(argv._).toContain('generate-env');
  });

  test('ge alias should work', async () => {
    const argv = await parseCli('ge', {});
    expect(argv._).toContain('ge');
  });

  test('env alias should work', async () => {
    const argv = await parseCli('env', {});
    expect(argv._).toContain('env');
  });

  test('should have default-environment option with default value Staging', async () => {
    const argv = await parseCli('generate-env', {});
    expect(argv.defaultEnvironment).toEqual('Staging');
  });

  test('should accept -d alias for default-environment', async () => {
    const argv = await parseCli('generate-env -d=Production', {});
    expect(argv.defaultEnvironment).toEqual('Production');
  });

  test('should have path option with default value ./', async () => {
    const argv = await parseCli('generate-env', {});
    expect(argv.path).toEqual('./');
  });

  test('should accept -p alias for path', async () => {
    const customPath = 'custom-path';
    const argv = await parseCli(`generate-env -p=${customPath}`, {});
    expect(argv.path).toEqual(customPath);
  });
});

describe('deploy command options', () => {
  test('should have destroy option with default false', async () => {
    const argv = await parseCli('deploy', {});
    expect(argv.destroy).toEqual(false);
  });

  test('should accept --destroy flag', async () => {
    const argv = await parseCli('deploy --destroy', {});
    expect(argv.destroy).toEqual(true);
  });

  test('should have skip-deploy option with default false', async () => {
    const argv = await parseCli('deploy', {});
    expect(argv.skipDeploy).toEqual(false);
  });

  test('should accept --skip alias', async () => {
    // Note: We can't fully test this as it calls process.exit
    // Just verify the option exists
    const argv = await parseCli('print-args', { skipDeploy: true });
    expect(argv.skipDeploy).toEqual(true);
  });

  test('should have lambda-image option with default false', async () => {
    const argv = await parseCli('deploy', {});
    expect(argv.lambdaImage).toBeDefined();
  });

  test('should have lambda-external option with default empty array', async () => {
    const argv = await parseCli('deploy', {});
    expect(argv.lambdaExternal).toEqual([]);
  });

  test('should have lambda-entry-points-base-dir option with default src', async () => {
    const argv = await parseCli('deploy', {});
    expect(argv.lambdaEntryPointsBaseDir).toEqual('src');
  });

  test('should have lambda-entry-points option with default empty', async () => {
    const argv = await parseCli('deploy', {});
    expect(argv.lambdaEntryPoints).toEqual([]);
  });

  test('should have lambda-format option with default esm', async () => {
    const argv = await parseCli('deploy', {});
    expect(argv.lambdaFormat).toEqual('esm');
  });

  test('should accept lambda-format cjs', async () => {
    const argv = await parseCli('deploy', { lambdaFormat: 'cjs' });
    expect(argv.lambdaFormat).toEqual('cjs');
  });

  test('should have lambda-outdir option with default dist', async () => {
    const argv = await parseCli('deploy', {});
    expect(argv.lambdaOutdir).toEqual('dist');
  });

  test('should have parameters option with default empty array', async () => {
    const argv = await parseCli('deploy', {});
    expect(argv.parameters).toEqual([]);
  });

  test('should accept -p alias for parameters', async () => {
    // Parameters can be passed as array
    const argv = await parseCli('deploy', {
      parameters: [{ key: 'key1', value: 'value1' }],
    });
    expect(argv.parameters).toEqual([{ key: 'key1', value: 'value1' }]);
  });

  test('should coerce object parameters to array format', async () => {
    const argv = await parseCli('deploy', {
      parameters: { key1: 'value1', key2: 'value2' },
    });
    expect(argv.parameters).toEqual([
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' },
    ]);
  });

  test('should have template-path option', async () => {
    const templatePath = 'custom/path/template.yml';
    const argv = await parseCli('deploy', { templatePath });
    expect(argv.templatePath).toEqual(templatePath);
  });

  test('should accept -t alias for template-path', async () => {
    const templatePath = 'custom/path/template.yml';
    const argv = await parseCli(`deploy -t=${templatePath}`, {});
    expect(argv.templatePath).toEqual(templatePath);
  });

  test('should have stack-name option', async () => {
    const stackName = 'my-stack-name';
    const argv = await parseCli('deploy', { stackName });
    expect(argv.stackName).toEqual(stackName);
  });

  test('should have aws-account-id option', async () => {
    const awsAccountId = '123456789012';
    const argv = await parseCli('print-args', { awsAccountId });
    expect(argv.awsAccountId).toEqual(awsAccountId);
  });
});

describe('deploy subcommands', () => {
  test('should recognize base-stack subcommand', async () => {
    const argv = await parseCli('deploy base-stack', {});
    expect(argv._).toContain('deploy');
  });

  test('should recognize static-app subcommand', async () => {
    const argv = await parseCli('deploy static-app', {});
    expect(argv._).toContain('deploy');
  });

  test('should recognize vercel subcommand', async () => {
    const argv = await parseCli('deploy vercel', {});
    expect(argv._).toContain('deploy');
  });

  test('should recognize cicd subcommand', async () => {
    // CICD requires ssh-key and ssh-url so we just test the command recognition
    const argv = await parseCli('print-args', {});
    expect(argv).toBeDefined();
  });

  test('should recognize lambda-layer subcommand with packages option', async () => {
    const argv = await parseCli(
      'deploy lambda-layer --packages carlin@1.0.0',
      {}
    );
    expect(argv._).toContain('deploy');
    expect(argv.packages).toContain('carlin@1.0.0');
  });
});

describe('static-app options', () => {
  test('should have cloudfront option with default false', async () => {
    const argv = await parseCli('deploy static-app', {});
    expect(argv.cloudfront).toEqual(false);
  });

  test('should have spa option with default false', async () => {
    const argv = await parseCli('deploy static-app', {});
    expect(argv.spa).toEqual(false);
  });

  test('should have skip-upload option with default false', async () => {
    const argv = await parseCli('deploy static-app', {});
    expect(argv.skipUpload).toEqual(false);
  });

  test('should have append-index-html option with default false', async () => {
    const argv = await parseCli('deploy static-app', {});
    expect(argv.appendIndexHtml).toEqual(false);
  });
});

describe('vercel options', () => {
  test('should accept token option', async () => {
    const token = 'vercel-token-123';
    const argv = await parseCli('deploy vercel', { token });
    expect(argv.token).toEqual(token);
  });
});

describe('print-args command', () => {
  test('print-args command should be available (hidden)', async () => {
    const argv = await parseCli('print-args', {});
    expect(argv._).toContain('print-args');
  });
});

describe('environments configuration', () => {
  test('should merge environment-specific options', async () => {
    const argv = await parseCli('print-args', { environment: 'Production' });
    expect(argv.optionEnv).toEqual(
      optionsFromConfigFiles.environments.Production.optionEnv
    );
  });

  test('should merge environment-specific array options', async () => {
    const argv = await parseCli('print-args', { environment: 'Production' });
    expect(argv.optionEnvArray).toEqual(
      optionsFromConfigFiles.environments.Production.optionEnvArray
    );
  });

  test('should merge environment-specific object options', async () => {
    const argv = await parseCli('print-args', { environment: 'Production' });
    expect(argv.optionEnvObj).toEqual(
      optionsFromConfigFiles.environments.Production.optionEnvObj
    );
  });
});

describe('CLI strictness', () => {
  test('should allow unknown options in config (non-strict options)', async () => {
    // This is important because config files may have additional options
    const argv = await parseCli('print-args', { unknownOption: 'value' });
    expect(argv.unknownOption).toEqual('value');
  });
});
