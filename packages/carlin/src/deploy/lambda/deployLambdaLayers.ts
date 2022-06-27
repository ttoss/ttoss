import { deployLambdaLayer } from '../lambdaLayer/deployLambdaLayer';
import log from 'npmlog';
import path from 'path';

const logPrefix = 'lambda';

export const deployLambdaLayers = async ({
  lambdaExternals = [],
}: {
  lambdaExternals: string[];
}) => {
  if (lambdaExternals.length === 0) {
    return;
  }

  log.info(
    logPrefix,
    `--lambda-externals [${lambdaExternals.join(
      ', '
    )}] was found. Creating other layers...`
  );

  const { dependencies = {} } = (() => {
    try {
      return require(path.resolve(process.cwd(), 'package.json')) || {};
    } catch (err: any) {
      log.error(
        logPrefix,
        'Cannot read package.json. Error message: %j',
        err.message
      );
      return {};
    }
  })();

  const packages = lambdaExternals.map((lambdaExternal) => {
    try {
      const semver = dependencies[lambdaExternal].replace(/(~|\^)/g, '');
      return `${lambdaExternal}@${semver}`;
    } catch {
      throw new Error(
        `Cannot find ${lambdaExternal} on package.json dependencies.`
      );
    }
  });

  await deployLambdaLayer({ packages, deployIfExists: false });
};
