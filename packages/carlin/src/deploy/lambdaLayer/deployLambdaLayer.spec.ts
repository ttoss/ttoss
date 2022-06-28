import { faker } from '@ttoss/test-utils/faker';

import { getPackageLambdaLayerStackName } from './deployLambdaLayer';

const generateRandomPackageName = () =>
  `@${faker.random.word()}/${faker.random.word()}@${faker.datatype.number()}.${faker.datatype.number()}.${faker.datatype.number()}`;

describe('testing getPackageLambdaLayerStackName', () => {
  test('should return a valid stack name', () => {
    [
      generateRandomPackageName(),
      generateRandomPackageName(),
      generateRandomPackageName(),
    ].forEach((packageName) => {
      expect(getPackageLambdaLayerStackName(packageName)).toMatch(
        new RegExp('[a-zA-Z][-a-zA-Z0-9]*')
      );
    });

    expect(getPackageLambdaLayerStackName('@scope/package@1.2.3')).toMatch(
      new RegExp('^.*ScopePackage1dot2dot3$')
    );
  });
});
