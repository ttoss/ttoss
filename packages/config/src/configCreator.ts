import deepmerge from 'deepmerge';

const overwriteMerge = (_: any, sourceArray: any) => {
  return sourceArray;
};

export const configCreator = <T extends Record<string, any>>(
  defaultConfig: T = {} as T
) => {
  return (
    config: T = {} as T,
    deepmergeConfig?: { arrayMerge: 'append' | 'overwrite' }
  ) => {
    return deepmerge<T>(defaultConfig, config, {
      arrayMerge:
        deepmergeConfig?.arrayMerge === 'overwrite'
          ? overwriteMerge
          : undefined,
    });
  };
};
