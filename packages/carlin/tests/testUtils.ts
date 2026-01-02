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

/**
 * Every time we import parseCli, we need to mock `findup-sync`.
 */
jest.mock('findup-sync', () => {
  return {
    __esModule: true,
    default: jest
      .fn()
      .mockReturnValueOnce('./some-dir')
      .mockReturnValueOnce(undefined),
  };
});

import { cli } from 'src/cli';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseCli = async (arg: any, context: any) => {
  const cliInstance = cli();
  // Merge context with parsed args for backward compatibility
  const mergedContext = { ...optionsFromConfigFiles, ...context };
  return cliInstance.parse(arg, mergedContext);
};
