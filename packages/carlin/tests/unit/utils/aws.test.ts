import {
  BatchGetBuildsCommand,
  CodeBuildClient,
  StartBuildCommand,
} from '@aws-sdk/client-codebuild';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { mockClient } from 'aws-sdk-client-mock';
import { startCodeBuildBuild, waitCodeBuildFinish } from 'src/utils/codeBuild';
import { setEnvVar } from 'src/utils/environmentVariables';
import { getAwsAccountId } from 'src/utils/getAwsAccountId';

const codeBuildMock = mockClient(CodeBuildClient);
const stsMock = mockClient(STSClient);

beforeEach(() => {
  codeBuildMock.reset();
  stsMock.reset();
  setEnvVar('REGION', 'sa-east-1');
});

afterEach(() => {
  jest.useRealTimers();
});

describe('getAwsAccountId', () => {
  test('should return the account of the caller identity', async () => {
    stsMock.on(GetCallerIdentityCommand).resolves({ Account: '123456789012' });

    await expect(getAwsAccountId()).resolves.toEqual('123456789012');
  });

  test('should create the client in the CLI region', async () => {
    stsMock.on(GetCallerIdentityCommand).resolves({ Account: '1' });

    await getAwsAccountId();

    const client = stsMock.call(0).thisValue as STSClient;
    await expect(client.config.region()).resolves.toEqual('sa-east-1');
  });
});

describe('startCodeBuildBuild', () => {
  test('should start the build of the project', async () => {
    codeBuildMock.on(StartBuildCommand).resolves({ build: { id: 'build-id' } });

    await expect(
      startCodeBuildBuild({ projectName: 'my-project' })
    ).resolves.toEqual({ id: 'build-id' });

    expect(
      codeBuildMock.commandCalls(StartBuildCommand)[0].args[0].input
    ).toEqual({ projectName: 'my-project' });
  });

  test('should throw if the build is not started', async () => {
    codeBuildMock.on(StartBuildCommand).resolves({});

    await expect(
      startCodeBuildBuild({ projectName: 'my-project' })
    ).rejects.toThrow('Cannot start my-project build');
  });
});

describe('waitCodeBuildFinish', () => {
  const buildId = 'build-id';

  /**
   * Each poll waits 10 seconds before checking the build.
   */
  const runPolls = async (count: number) => {
    for (let i = 0; i < count; i++) {
      await jest.advanceTimersByTimeAsync(10 * 1000);
    }
  };

  test('should poll until the build succeeds', async () => {
    jest.useFakeTimers();

    codeBuildMock
      .on(BatchGetBuildsCommand)
      .resolvesOnce({
        builds: [
          { id: buildId, currentPhase: 'BUILD', buildStatus: 'IN_PROGRESS' },
        ],
      })
      .resolves({
        builds: [
          { id: buildId, currentPhase: 'COMPLETED', buildStatus: 'SUCCEEDED' },
        ],
      });

    const promise = waitCodeBuildFinish({ buildId, name: 'my-build' });

    await runPolls(2);

    await expect(promise).resolves.toEqual({
      id: buildId,
      currentPhase: 'COMPLETED',
      buildStatus: 'SUCCEEDED',
    });

    expect(codeBuildMock.commandCalls(BatchGetBuildsCommand)).toHaveLength(2);
    expect(
      codeBuildMock.commandCalls(BatchGetBuildsCommand)[0].args[0].input
    ).toEqual({ ids: [buildId] });
  });

  test('should reject if the build fails', async () => {
    jest.useFakeTimers();

    codeBuildMock.on(BatchGetBuildsCommand).resolves({
      builds: [
        { id: buildId, currentPhase: 'COMPLETED', buildStatus: 'FAILED' },
      ],
    });

    const promise = waitCodeBuildFinish({ buildId });

    const assertion = expect(promise).rejects.toThrow(
      `Cannot execute build ${buildId}.`
    );

    await runPolls(1);

    await assertion;
  });
});
