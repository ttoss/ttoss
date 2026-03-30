import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  testEnvironment: 'jsdom',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'src/index.ts',
    'src/_model/tokenResolution.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 95, // 95% minimum coverage for statements
      branches: 95, // 95% minimum coverage for branches
      lines: 95, // 95% minimum coverage for lines
      functions: 95, // 95% minimum coverage for functions
    },
  },
});
