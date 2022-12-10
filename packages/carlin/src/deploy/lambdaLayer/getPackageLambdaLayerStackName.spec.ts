import { faker } from '@ttoss/test-utils/faker';
import {
  getPackageLambdaLayerStackName,
  lambdaLayerStackNamePrefix,
} from './getPackageLambdaLayerStackName';

const generateRandomPackageName = () => {
  return `@${faker.random.word()}/${faker.random.word()}@${faker.datatype.number()}.${faker.datatype.number()}.${faker.datatype.number()}`;
};

describe('testing getPackageLambdaLayerStackName', () => {
  test('should return a valid stack name', () => {
    [
      generateRandomPackageName(),
      generateRandomPackageName(),
      generateRandomPackageName(),
      '@scope/package@1.2.3',
      '@scope/package@^1.2.3',
      'package@3.2.1',
    ].forEach((packageName) => {
      expect(getPackageLambdaLayerStackName(packageName)).toMatch(
        new RegExp('[a-zA-Z][-a-zA-Z0-9]*')
      );
    });
  });

  test('should return a valid stack name for scoped packages', () => {
    expect(getPackageLambdaLayerStackName('@scope/package@1.2.3')).toEqual(
      `${lambdaLayerStackNamePrefix}-ScopePackage-1-2-3`
    );
  });

  test('should return a valid stack name for scoped packages with ^', () => {
    expect(getPackageLambdaLayerStackName('@scope/package@^1.2.3')).toEqual(
      `${lambdaLayerStackNamePrefix}-ScopePackage-1-2-3`
    );
  });

  test('should return a valid stack name for scoped packages with ~', () => {
    expect(getPackageLambdaLayerStackName('@scope/package@~1.2.3')).toEqual(
      `${lambdaLayerStackNamePrefix}-ScopePackage-1-2-3`
    );
  });

  test('should return a valid stack name for no scoped packages', () => {
    expect(getPackageLambdaLayerStackName('package@3.2.1')).toEqual(
      `${lambdaLayerStackNamePrefix}-Package-3-2-1`
    );
  });
});
