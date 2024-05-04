/* eslint-disable no-param-reassign */
import { CommandModule, InferredOptionTypes } from 'yargs';
import { NAME } from '../../config';
import { addGroupToOptions } from '../../utils';
import { deployLambdaLayer } from './deployLambdaLayer';
import log from 'npmlog';

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

export const deployLambdaLayerCommand: CommandModule<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  InferredOptionTypes<typeof options>
> = {
  command: 'lambda-layer',
  describe: 'Deploy Lambda Layer.',
  builder: (yargs) => {
    return yargs
      .options(addGroupToOptions(options, 'Deploy Lambda Layer Options'))
      .check(({ packages }) => {
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
        } else {
          return true;
        }
      });
  },
  handler: ({ destroy, ...rest }) => {
    if (destroy) {
      log.info(logPrefix, `${NAME} doesn't destroy lambda layers.`);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deployLambdaLayer(rest as any);
    }
  },
};
