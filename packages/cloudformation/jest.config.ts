import { jestConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const config = jestConfig({
  transformIgnorePatterns: getTransformIgnorePatterns(),
});

export default config;
