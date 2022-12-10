/**
 * Should import this module before importing the methods that you'll test.
 */
export const optionsFromConfigFiles = {
  option: 'option',
  optionEnv: 'optionEnv',
  optionEnvArray: ['optionEnvArray1', 'optionEnvArray2'],
  optionEnvObj: {
    a: 'optionEnvObjA',
    b: 2,
  },
  environments: {
    OtherRegion: {
      region: 'us-east-3',
    },
    Production: {
      region: 'us-east-2',
      optionEnv: 'optionEnvProduction',
      optionEnvArray: [
        'optionEnvArrayProduction1',
        'optionEnvArrayProduction2',
      ],
      optionEnvObj: {
        a: 'optionEnvObjProductionA',
        b: 3,
      },
    },
  },
};

import cli from './src/cli';

export const parseCli = async (arg: any, context: any) => {
  return cli().strict(false).parse(arg, context);
};
