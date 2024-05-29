jest.mock('./../../src/deploy/cloudformation', () => {
  return {
    deployCloudFormation: jest.fn(),
    destroyCloudFormation: jest.fn(),
  };
});

jest.mock('./../../src/deploy/readDockerfile');

import * as commandModule from '../../src/deploy/command';
import * as deployLambdaLayerModule from '../../src/deploy/lambdaLayer/deployLambdaLayer';
import * as deployStaticAppModule from '../../src/deploy/staticApp/deployStaticApp';
import {
  deployCloudFormation,
  destroyCloudFormation,
} from '../../src/deploy/cloudformation';
import { faker } from '@ttoss/test-utils/faker';
import { getEnvVar } from '../../src/utils/environmentVariables';
import {
  getStackName,
  setPreDefinedStackName,
} from '../../src/deploy/stackName';
import { readDockerfile } from '../../src/deploy/readDockerfile';
import yargs from 'yargs';

const cli = yargs().command(commandModule.deployCommand);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parse = (command: string, options: any = {}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Promise<any>((resolve, reject) => {
    cli.parse(command, options, (err, argv) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(argv);
    });
  });
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe('testing skip-deploy flag', () => {
  const realProcess = process;
  const mockExit = jest.fn();

  /**
   * https://stackoverflow.com/a/49290777/8786986
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.process = { ...realProcess, exit: mockExit as any };

  beforeEach(() => {
    mockExit.mockReset();
  });

  afterAll(() => {
    mockExit.mockRestore();
  });

  test('should skip deploy', async () => {
    await parse('deploy', { skipDeploy: true });

    expect(mockExit).toHaveBeenCalledWith(0);
  });

  test('should not skip deploy', async () => {
    await parse('deploy', {
      skipDeploy: false,
      environments: {
        Production: {
          skipDeploy: true,
        },
      },
    });

    expect(mockExit).not.toHaveBeenCalled();
  });
});

describe('stack name and cache', () => {
  beforeEach(() => {
    setPreDefinedStackName('');
  });

  afterAll(() => {
    setPreDefinedStackName('');
  });

  test('should save stack name on cache', async () => {
    const stackName = faker.random.word();
    const argv = await parse('deploy', { stackName });
    expect(argv.stackName).toEqual(stackName);
    expect(await getStackName()).toEqual(stackName);
  });

  test('cache should not have stack name', async () => {
    const argv = await parse('deploy');
    expect(argv.stackName).toBeUndefined();
    expect(getEnvVar('STACK_NAME')).toBeUndefined();
  });
});

describe('lambda-dockerfile', () => {
  test("should return empty string if Dockerfile doesn't exists", async () => {
    (readDockerfile as jest.Mock).mockReturnValue(new Error());

    const { lambdaDockerfile, lambdaImage } = await parse('', {});

    expect(lambdaDockerfile).toBeUndefined();
    expect(lambdaImage).toBeFalsy();
  });

  test('should return Dockerfile if default exists', async () => {
    const dockerfile = faker.random.words();

    (readDockerfile as jest.Mock).mockReturnValue(dockerfile);

    const { lambdaDockerfile, lambdaImage } = await parse('deploy', {});

    expect(readDockerfile).toHaveBeenCalledWith(
      commandModule.options['lambda-dockerfile'].default
    );

    expect(lambdaDockerfile).toEqual(dockerfile);
    expect(lambdaImage).toBeTruthy();
  });
});

describe('handlers', () => {
  test('should call deployCloudFormation', async () => {
    await parse('deploy');
    expect(deployCloudFormation).toHaveBeenCalledTimes(1);
  });

  test.each([
    {
      parameters: [
        {
          key: 'key1',
          value: 'value1',
        },
        {
          key: 'key2',
          value: 'value2',
        },
      ],
    },
    {
      parameters: {
        key1: 'value1',
        key2: 'value2',
      },
    },
  ])(
    'should call deployCloudFormation with parameters %#',
    async ({ parameters }) => {
      await parse('deploy', { parameters });
      expect(deployCloudFormation).toHaveBeenCalledWith(
        expect.objectContaining({
          parameters: [
            {
              key: 'key1',
              value: 'value1',
            },
            {
              key: 'key2',
              value: 'value2',
            },
          ],
        })
      );
    }
  );

  test.each([
    {
      module: deployLambdaLayerModule,
      method: 'deployLambdaLayer',
      command: 'deploy lambda-layer --packages carlin@1.2.3',
    },
    {
      module: deployStaticAppModule,
      method: 'deployStaticApp',
      command: 'deploy static-app',
    },
  ])('should call $method', async ({ module, method, command }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mock = jest.spyOn(module as any, method).mockImplementation(() => {
      return Promise.resolve();
    });

    await parse(command);

    expect(mock).toHaveBeenCalledTimes(1);
    expect(deployCloudFormation).not.toHaveBeenCalled();
  });

  test('should call destroyCloudFormation', async () => {
    await parse('deploy', { destroy: true });
    expect(destroyCloudFormation).toHaveBeenCalled();
  });
});
