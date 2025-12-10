/* eslint-disable no-param-reassign */
import log from 'npmlog';
import { Command } from 'commander';

import { NAME } from '../../config';
import { deployLambdaLayer } from './deployLambdaLayer';

const logPrefix = 'deploy-lambda-layer';

/**
 * https://stackoverflow.com/a/64880672/8786986
 */
const packageNameRegex = /@[~^]?([\dvx*]+(?:[-.](?:[\dx*]+|alpha|beta))*)/;

export const options = {
  packages: {
    array: true,
    describe: `NPM packages' names to be deployed as Lambda Layers. It must follow the format: ${packageNameRegex.toString()}.`,
    required: true,
    type: 'string',
  },
} as const;

export const deployLambdaLayerCommand = new Command('lambda-layer')
  .description('Deploy Lambda Layer.')
  .requiredOption(
    '--packages <packages...>',
    options.packages.describe
  )
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    const packages = opts.packages as string[];

    const invalidPackages = packages
      .map((packageName) => {
        return packageNameRegex.test(packageName) ? undefined : packageName;
      })
      .filter((packageName) => {
        return !!packageName;
      });

    if (invalidPackages.length > 0) {
      throw new Error(
        `Some package names are invalid: ${invalidPackages.join(
          ', '
        )}. The package must follow the pattern: ${packageNameRegex.toString()}.`
      );
    }
  })
  .action(async function (this: Command) {
    const opts = this.opts();
    const parentOpts = this.parent?.parent?.opts() || {};
    const allOpts = { ...parentOpts, ...opts };

    if (allOpts.destroy) {
      log.info(logPrefix, `${NAME} doesn't destroy lambda layers.`);
    } else {
      await deployLambdaLayer({
        ...allOpts,
        runtime: allOpts.lambdaRuntime,
      } as any);
    }
  });
