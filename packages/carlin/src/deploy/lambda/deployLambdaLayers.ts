import * as fs from 'fs';
import * as path from 'path';
import { deployLambdaLayer } from '../lambdaLayer/deployLambdaLayer';
import log from 'npmlog';

const logPrefix = 'lambda';

export const deployLambdaLayers = async ({
  lambdaExternal = [],
}: {
  lambdaExternal: string[];
}) => {
  if (lambdaExternal.length === 0) {
    return;
  }

  log.info(
    logPrefix,
    `--lambda-externals [${lambdaExternal.join(
      ', '
    )}] was found. Creating other layers...`
  );

  const { dependencies = {} } = (() => {
    try {
      return JSON.parse(
        fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      log.error(
        logPrefix,
        'Cannot read package.json. Error message: %j',
        err.message
      );
      return {};
    }
  })();

  const packages = lambdaExternal.map((external) => {
    try {
      const semver = dependencies[external].replace(/(~|\^)/g, '');
      return `${external}@${semver}`;
    } catch {
      throw new Error(`Cannot find ${external} on package.json dependencies.`);
    }
  });

  await deployLambdaLayer({ packages, deployIfExists: false });
};
