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
import AWS from 'aws-sdk';
import * as deepmerge from 'deepmerge';
import { AWS_DEFAULT_REGION } from 'src/config';
import { deployBaseStack } from 'src/deploy/baseStack/deployBaseStack';
import { cloudformation } from 'src/deploy/cloudformation.core';
import {
  getCurrentBranch,
  getEnvironment,
  getEnvVar,
  getProjectName,
} from 'src/utils';

beforeAll(() => {
  (deepmerge.all as jest.Mock).mockReturnValue(optionsFromConfigFiles);
});

describe('testing AWS region', () => {
  test.each([
    /**
     * Sometimes `CARLIN_ENVIRONMENT` is defined, then `-e=undefined` is
     * necessary.
     */
    [`print-args -e=undefined`, AWS_DEFAULT_REGION],
    [`print-args --region=some-region`, 'some-region'],
    [
      `print-args --environment=Production`,
      optionsFromConfigFiles.environments.Production.region,
    ],
    [
      `print-args -e=OtherRegion`,
      optionsFromConfigFiles.environments.OtherRegion.region,
    ],
    [`print-args -e=OtherRegion --region=some-region`, 'some-region'],
  ])('%#: %p', async (command, result) => {
    const argv = await parseCli(command, {});
    expect(argv.region).toEqual(result);
    expect(AWS.config.region).toEqual(result);
    expect(await cloudformation().config.region()).toEqual(result);
    expect(getEnvVar('REGION')).toEqual(result);
  });
});

describe('environment type', () => {
  beforeAll(() => {
    delete process.env.CARLIN_ENVIRONMENT;
  });

  test('throw error if it is an object', () => {
    return expect(() => {
      return parseCli(`print-args`, {
        environment: { obj: faker.word.sample() },
      });
    }).rejects.toThrow();
  });

  test('throw error if it is an array', () => {
    return expect(() => {
      return parseCli(`print-args`, {
        environment: [faker.word.sample()],
      });
    }).rejects.toThrow();
  });

  test("don't throw error if it is a string", async () => {
    const environment = faker.word.sample();
    const argv = await parseCli(`print-args`, { environment });
    expect(argv.environment).toEqual(environment);
  });

  test("don't throw error if it is a string and environment undefined", async () => {
    const argv = await parseCli(`print-args`, {});
    expect(argv.environment).toBeUndefined();
  });
});

describe('validating environment variables', () => {
  afterEach(() => {
    delete process.env.CARLIN_BRANCH;
    delete process.env.CARLIN_ENVIRONMENT;
    delete process.env.ENVIRONMENT;
    delete process.env.CARLIN_PROJECT;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const testExpects = async ({ argv, branch, environment, project }: any) => {
    expect(await getCurrentBranch()).toEqual(branch);
    expect(argv.branch).toEqual(branch);

    expect(getEnvironment()).toEqual(environment);
    expect(argv.environment).toEqual(environment);

    expect(getProjectName()).toEqual(project);
    expect(argv.project).toEqual(project);
  };

  test('passing by options', async () => {
    const { branch, environment, project } = {
      branch: 'branch1',
      environment: 'environment1',
      project: 'project1',
    };

    /**
     * Use options this way to coerce to work.
     */
    const options = [
      `--branch=${branch}`,
      `--environment=${environment}`,
      `--project=${project}`,
    ].join(' ');

    const argv = await parseCli(`print-args ${options}`, {});

    await testExpects({ argv, branch, environment, project });
  });

  test('passing by process.env', async () => {
    const { branch, environment, project } = {
      branch: 'branch2',
      environment: 'environment2',
      project: 'project2',
    };

    process.env.CARLIN_BRANCH = branch;
    process.env.CARLIN_ENVIRONMENT = environment;
    process.env.CARLIN_PROJECT = project;

    const argv = await parseCli('print-args', {});

    await testExpects({ argv, branch, environment, project });
  });

  test('passing by process.env.ENVIRONMENT instead of CARLIN_ENVIRONMENT', async () => {
    const { branch, environment, project } = {
      branch: 'branch3',
      environment: 'environment3',
      project: 'project3',
    };

    process.env.CARLIN_BRANCH = branch;
    process.env.ENVIRONMENT = environment;
    process.env.CARLIN_PROJECT = project;

    const testUtilsModule = await import('tests/testUtils');

    const argv = await testUtilsModule.parseCli('print-args', {});

    await testExpects({ argv, branch, environment, project });
  });
});

describe('testing environment if process.env.ENVIRONMENT is defined', () => {
  const environment = 'testing-environment-with-process-env-ENVIRONMENT';

  beforeAll(() => {
    process.env.ENVIRONMENT = environment;
  });

  test('environment must be defined', async () => {
    const argv = await parseCli('print-args', {});
    expect(argv.environment).toEqual(environment);
  });

  test('environment as option should take precedence', async () => {
    const newEnvironment = 'new-environment';
    const argv = await parseCli('print-args', {
      environment: newEnvironment,
    });
    expect(argv.environment).toEqual(newEnvironment);
  });

  afterAll(() => {
    delete process.env.ENVIRONMENT;
  });
});

describe('handle merge config correctly', () => {
  describe('Config merging errors when default values is present #16 https://github.com/ttoss/carlin/issues/16', () => {
    test('deploy base-stack --region should not be the default', async () => {
      await parseCli('deploy base-stack', {
        environment: 'Production',
      });
      expect(deployBaseStack).toHaveBeenCalledWith(
        expect.objectContaining({
          region: optionsFromConfigFiles.environments.Production.region,
        })
      );
    });
  });

  test('argv must have the options passed to CLI', async () => {
    const options = {
      region: faker.word.sample(),
    };
    const argv = await parseCli('print-args', options);
    expect(argv.environment).toBeUndefined();
    expect(argv).toMatchObject(options);
  });

  test('argv must have the environment option', async () => {
    const argv = await parseCli('print-args', { environment: 'Production' });
    expect(argv.environment).toBe('Production');
    expect(argv.optionEnv).toEqual(
      optionsFromConfigFiles.environments.Production.optionEnv
    );
    expect(argv.optionEnvArray).toEqual(
      optionsFromConfigFiles.environments.Production.optionEnvArray
    );
    expect(argv.optionEnvObj).toEqual(
      optionsFromConfigFiles.environments.Production.optionEnvObj
    );
  });

  test('argv must have the CLI optionEnv', async () => {
    const newOptionEnv = faker.word.sample();
    const argv = await parseCli('print-args', {
      environment: 'Production',
      optionEnv: newOptionEnv,
    });
    expect(argv.environment).toBe('Production');
    expect(argv.optionEnv).toEqual(newOptionEnv);
  });
});
