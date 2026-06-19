import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  moduleNameMapper: {
    '^../../models/dist$': '<rootDir>/tests/models/dist/index.cjs',
  },
});
