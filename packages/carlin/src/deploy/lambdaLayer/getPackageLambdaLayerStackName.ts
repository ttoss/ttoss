import { pascalCase } from 'change-case';

export const lambdaLayerStackNamePrefix = `LambdaLayer`;

export const getPackageLambdaLayerStackName = (packageName: string) => {
  const [scopedName, version] = packageName.split('@').filter((part) => {
    return !!part;
  });

  return [
    lambdaLayerStackNamePrefix,
    pascalCase(scopedName),
    version
      /**
       * Replace everything except alphanumeric characters and dots.
       */
      .replace(/[^0-9.]/g, '')
      .replace(/\./g, '-'),
  ].join('-');
};
