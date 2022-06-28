/* eslint-disable no-var */
import { optionsFromConfigFiles, parseCli } from '../testUtils';

jest.mock('./deploy/baseStack/deployBaseStack', () => ({
  ...(jest.requireActual('./deploy/baseStack/deployBaseStack') as any),
  deployBaseStack: jest.fn(),
}));

import * as deepmerge from 'deepmerge';
import { AWS_DEFAULT_REGION } from './config';
import { cloudFormation } from './deploy/cloudFormation.core';
import { deployBaseStack } from './deploy/baseStack/deployBaseStack';
import { faker } from '@ttoss/test-utils/faker';
import {
  getCurrentBranch,
  getEnvVar,
  getEnvironment,
  getProjectName,
} from './utils';
import AWS from 'aws-sdk';

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
    expect(await cloudFormation().config.region()).toEqual(result);
    expect(getEnvVar('REGION')).toEqual(result);
  });
});

describe('environment type', () => {
  beforeAll(() => {
    delete process.env.CARLIN_ENVIRONMENT;
  });

  test('throw error if it is an object', () => {
    return expect(() =>
      parseCli(`print-args`, {
        environment: { obj: faker.random.word() },
      })
    ).rejects.toThrow();
  });

  test('throw error if it is an array', () => {
    return expect(() =>
      parseCli(`print-args`, {
        environment: [faker.random.word()],
      })
    ).rejects.toThrow();
  });

  test("don't throw error if it is a string", async () => {
    const environment = faker.random.word();
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
    delete process.env.CARLIN_PROJECT;
  });

  const generateRandomVariables = () => ({
    branch: faker.random.word(),
    environment: faker.random.word(),
    project: faker.random.word(),
  });

  const testExpects = async ({ argv, branch, environment, project }: any) => {
    expect(await getCurrentBranch()).toEqual(branch);
    expect(argv.branch).toEqual(branch);

    expect(getEnvironment()).toEqual(environment);
    expect(argv.environment).toEqual(environment);

    expect(getProjectName()).toEqual(project);
    expect(argv.project).toEqual(project);
  };

  // eslint-disable-next-line jest/expect-expect
  test('passing by options', async () => {
    const { branch, environment, project } = generateRandomVariables();

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

  // eslint-disable-next-line jest/expect-expect
  test('passing by process.env', async () => {
    const { branch, environment, project } = generateRandomVariables();

    process.env.CARLIN_BRANCH = branch;
    process.env.CARLIN_ENVIRONMENT = environment;
    process.env.CARLIN_PROJECT = project;

    const argv = await parseCli('print-args', {});

    await testExpects({ argv, branch, environment, project });
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
      region: faker.random.word(),
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
    const newOptionEnv = faker.random.word();
    const argv = await parseCli('print-args', {
      environment: 'Production',
      optionEnv: newOptionEnv,
    });
    expect(argv.environment).toBe('Production');
    expect(argv.optionEnv).toEqual(newOptionEnv);
  });
});
