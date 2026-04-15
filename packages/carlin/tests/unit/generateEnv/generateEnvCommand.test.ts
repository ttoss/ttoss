import * as fs from 'node:fs';

import { faker } from '@ttoss/test-utils/faker';

import { DEFAULT_ENVIRONMENT } from '../../../src/generateEnv/generateEnvCommand';
import { parseCli } from '../../testUtils';

jest.mock('findup-sync', () => {
  return {
    __esModule: true,
    default: jest
      .fn()
      .mockReturnValueOnce('./some-dir')
      .mockReturnValueOnce(undefined),
  };
});

jest.mock('fs', () => {
  return {
    ...jest.requireActual('fs'),
    promises: {
      ...jest.requireActual('fs').promises,
      readFile: jest.fn(),
      writeFile: jest.fn(),
    },
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

test('should read from .env.DEFAULT_ENVIRONMENT if environment is not defined', async () => {
  const content = faker.word.words(10);

  (fs.promises.readFile as jest.Mock).mockImplementationOnce(
    async (path: string) => {
      if (path.includes(`/.env.${DEFAULT_ENVIRONMENT}`)) {
        return content;
      }

      return undefined;
    }
  );

  await parseCli('generate-env', { environment: undefined });

  expect(fs.promises.writeFile).toHaveBeenCalledWith(
    expect.stringContaining('/.env'),
    content
  );
});

test.each([['Development'], ['Staging'], ['Production']])(
  'should read from .env.Environment if environment is defined - %s',
  async (environment) => {
    const content = faker.word.words(10);

    (fs.promises.readFile as jest.Mock).mockImplementationOnce(
      async (path: string) => {
        if (path.includes(`/.env.${environment}`)) {
          return content;
        }

        return undefined;
      }
    );

    await parseCli('generate-env', { environment });

    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('/.env'),
      content
    );
  }
);

test("should not write if .env file don't exists", async () => {
  (fs.promises.readFile as jest.Mock).mockResolvedValueOnce(undefined);

  await parseCli('generate-env', {});

  expect(fs.promises.writeFile).not.toHaveBeenCalled();
});

test('should read envs from path', async () => {
  const content = faker.word.words(10);

  const envsPath = 'some-dir';

  (fs.promises.readFile as jest.Mock).mockImplementationOnce(
    async (path: string) => {
      if (path.includes(`/${envsPath}/.env.Staging`)) {
        return content;
      }

      return undefined;
    }
  );

  await parseCli('generate-env', { path: envsPath, environment: 'Staging' });

  expect(fs.promises.writeFile).toHaveBeenCalledWith(
    expect.stringContaining('/.env'),
    content
  );
});

describe('envFromDeployOutputs', () => {
  const envContent = 'EXISTING_VAR=existing_value';

  const latestDeployFixture = {
    stackName: 'TestStack',
    outputs: {
      AppSyncApiGraphQLUrl: {
        OutputKey: 'AppSyncApiGraphQLUrl',
        OutputValue:
          'https://example.appsync-api.us-east-1.amazonaws.com/graphql',
        ExportName: 'TestStack:AppSyncApiGraphQLUrl',
      },
      AppSyncApiArn: {
        OutputKey: 'AppSyncApiArn',
        OutputValue: 'arn:aws:appsync:us-east-1:123456789:apis/abc123',
        ExportName: 'TestStack:AppSyncApiArn',
      },
    },
  };

  test('should append deploy output variables to .env content', async () => {
    jest
      .mocked(fs.promises.readFile)
      .mockImplementation(async (filePath: unknown) => {
        const p = filePath as string;

        if (p.includes('/.env.Staging')) {
          return envContent;
        }

        if (p.includes('.carlin/latest-deploy.json')) {
          return JSON.stringify(latestDeployFixture);
        }

        throw new Error(`Unexpected readFile call: ${p}`);
      });

    await parseCli('generate-env', {
      environment: 'Staging',
      envFromDeployOutputs: [
        {
          dir: '../graph-api',
          variables: {
            VITE_APPSYNC_GRAPHQL_ENDPOINT: 'AppSyncApiGraphQLUrl.OutputValue',
            VITE_APPSYNC_ARN: 'AppSyncApiArn.OutputValue',
          },
        },
      ],
    });

    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('/.env'),
      expect.stringContaining(
        'VITE_APPSYNC_GRAPHQL_ENDPOINT=https://example.appsync-api.us-east-1.amazonaws.com/graphql'
      )
    );

    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('/.env'),
      expect.stringContaining(
        'VITE_APPSYNC_ARN=arn:aws:appsync:us-east-1:123456789:apis/abc123'
      )
    );

    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('/.env'),
      expect.stringContaining('EXISTING_VAR=existing_value')
    );
  });

  test('should override duplicate keys from .env source file', async () => {
    const staticEndpoint = 'https://static.example.com/graphql';
    const deployedEndpoint =
      'https://example.appsync-api.us-east-1.amazonaws.com/graphql';

    jest
      .mocked(fs.promises.readFile)
      .mockImplementation(async (filePath: unknown) => {
        const p = filePath as string;

        if (p.includes('/.env.Staging')) {
          return `EXISTING_VAR=existing_value\nVITE_APPSYNC_GRAPHQL_ENDPOINT=${staticEndpoint}`;
        }

        if (p.includes('.carlin/latest-deploy.json')) {
          return JSON.stringify(latestDeployFixture);
        }

        throw new Error(`Unexpected readFile call: ${p}`);
      });

    await parseCli('generate-env', {
      environment: 'Staging',
      envFromDeployOutputs: [
        {
          dir: '../graph-api',
          variables: {
            VITE_APPSYNC_GRAPHQL_ENDPOINT: 'AppSyncApiGraphQLUrl.OutputValue',
          },
        },
      ],
    });

    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('/.env'),
      expect.not.stringContaining(staticEndpoint)
    );

    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('/.env'),
      expect.stringContaining(
        `VITE_APPSYNC_GRAPHQL_ENDPOINT=${deployedEndpoint}`
      )
    );
  });

  test('should support non-OutputValue fields via dot-notation', async () => {
    jest
      .mocked(fs.promises.readFile)
      .mockImplementation(async (filePath: unknown) => {
        const p = filePath as string;

        if (p.includes('/.env.Staging')) {
          return envContent;
        }

        if (p.includes('.carlin/latest-deploy.json')) {
          return JSON.stringify(latestDeployFixture);
        }

        throw new Error(`Unexpected readFile call: ${p}`);
      });

    await parseCli('generate-env', {
      environment: 'Staging',
      envFromDeployOutputs: [
        {
          dir: '../graph-api',
          variables: {
            VITE_APPSYNC_CONSOLE: 'AppSyncApiGraphQLUrl.ExportName',
          },
        },
      ],
    });

    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('/.env'),
      expect.stringContaining(
        'VITE_APPSYNC_CONSOLE=TestStack:AppSyncApiGraphQLUrl'
      )
    );
  });

  test('should skip and warn when output key is not found', async () => {
    jest
      .mocked(fs.promises.readFile)
      .mockImplementation(async (filePath: unknown) => {
        const p = filePath as string;

        if (p.includes('/.env.Staging')) {
          return envContent;
        }

        if (p.includes('.carlin/latest-deploy.json')) {
          return JSON.stringify(latestDeployFixture);
        }

        throw new Error(`Unexpected readFile call: ${p}`);
      });

    await parseCli('generate-env', {
      environment: 'Staging',
      envFromDeployOutputs: [
        {
          dir: '../graph-api',
          variables: {
            VITE_MISSING: 'NonExistentKey.OutputValue',
          },
        },
      ],
    });

    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('/.env'),
      expect.not.stringContaining('VITE_MISSING')
    );
  });

  test('should skip dir and warn when latest-deploy.json cannot be read', async () => {
    jest
      .mocked(fs.promises.readFile)
      .mockImplementation(async (filePath: unknown) => {
        const p = filePath as string;

        if (p.includes('/.env.Staging')) {
          return envContent;
        }

        throw new Error('File not found');
      });

    await parseCli('generate-env', {
      environment: 'Staging',
      envFromDeployOutputs: [
        {
          dir: '../missing-pkg',
          variables: {
            VITE_SOMETHING: 'SomeKey.OutputValue',
          },
        },
      ],
    });

    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('/.env'),
      envContent
    );
  });

  describe('setting envFromDeployOutputs to null for a specific environment', () => {
    const productionEnvContent =
      'EXISTING_VAR=existing_value\nVITE_OTHER_VAR=other_value';

    /**
     * This test mirrors the following carlin.yml pattern:
     *
     * envFromDeployOutputs:
     *   - dir: ../graph-api
     *     variables:
     *       VITE_APPSYNC_GRAPHQL_ENDPOINT: AppSyncApiGraphQLUrl.OutputValue
     *
     * environments:
     *   Production:
     *     envFromDeployOutputs: null
     *
     * When running `carlin generate-env --environment Production`, the
     * handleEnvironments middleware detects that envFromDeployOutputs came from
     * the config file and replaces it with null, disabling deploy output
     * resolution for Production. The effect is simulated here by passing
     * envFromDeployOutputs: null directly in context.
     */
    test('should write only static env content and skip deploy output resolution', async () => {
      jest
        .mocked(fs.promises.readFile)
        .mockImplementation(async (filePath: unknown) => {
          const p = filePath as string;

          if (p.includes('/.env.Production')) {
            return productionEnvContent;
          }

          throw new Error(`Unexpected readFile call: ${p}`);
        });

      await parseCli('generate-env', {
        environment: 'Production',
        envFromDeployOutputs: null,
      });

      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('/.env'),
        productionEnvContent
      );

      expect(fs.promises.readFile).not.toHaveBeenCalledWith(
        expect.stringContaining('.carlin/latest-deploy.json'),
        expect.anything()
      );
    });
  });
});
