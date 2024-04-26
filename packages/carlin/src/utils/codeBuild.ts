import AWS from 'aws-sdk';
import log from 'npmlog';

const logPrefix = 'codebuild';

const WAIT_TIME = 10 * 1000;

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
  const codeBuild = new AWS.CodeBuild();

  let result;

  const checkIfBuildIsFinished = async () => {
    const { builds } = await codeBuild
      .batchGetBuilds({ ids: [buildId] })
      .promise();

    return new Promise<AWS.CodeBuild.Build | undefined>((resolve, reject) => {
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
    // eslint-disable-next-line no-await-in-loop
    result = await checkIfBuildIsFinished();
  }

  return result;
};

export const startCodeBuildBuild = async ({
  projectName,
}: {
  projectName: string;
}) => {
  const codeBuild = new AWS.CodeBuild();

  const { build } = await codeBuild.startBuild({ projectName }).promise();

  if (!build) {
    throw new Error(`Cannot start ${projectName} build`);
  }

  return build;
};
