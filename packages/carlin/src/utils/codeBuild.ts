import {
  BatchGetBuildsCommand,
  type Build,
  CodeBuildClient,
  StartBuildCommand,
} from '@aws-sdk/client-codebuild';

import { getEnvVar } from './environmentVariables';
import { log } from './log';

const logPrefix = 'codebuild';

const WAIT_TIME = 10 * 1000;

export const codeBuild = () => {
  return new CodeBuildClient({ region: getEnvVar('REGION') });
};

/**
 * @param param.name name used to identify the build.
 */
export const waitCodeBuildFinish = async ({
  buildId,
  name,
}: {
  buildId: string;
  name?: string;
}) => {
  const client = codeBuild();

  let result;

  const checkIfBuildIsFinished = async () => {
    const { builds } = await client.send(
      new BatchGetBuildsCommand({ ids: [buildId] })
    );

    return new Promise<Build | undefined>((resolve, reject) => {
      setTimeout(() => {
        const executedBuild = builds?.find(({ id }) => {
          return id === buildId;
        });

        log.info(
          logPrefix,
          `Build status of ${name || buildId}: ${executedBuild?.buildStatus}`
        );

        if (executedBuild && executedBuild.currentPhase === 'COMPLETED') {
          if (executedBuild.buildStatus === 'SUCCEEDED') {
            resolve(executedBuild);
          } else if (
            ['FAILED', 'FAILURE'].includes(executedBuild.buildStatus || '')
          ) {
            reject(new Error(`Cannot execute build ${buildId}.`));
          }
        }

        resolve(undefined);
      }, WAIT_TIME);
    });
  };

  while (!result) {
    result = await checkIfBuildIsFinished();
  }

  return result;
};

export const startCodeBuildBuild = async ({
  projectName,
}: {
  projectName: string;
}) => {
  const { build } = await codeBuild().send(
    new StartBuildCommand({ projectName })
  );

  if (!build) {
    throw new Error(`Cannot start ${projectName} build`);
  }

  return build;
};
