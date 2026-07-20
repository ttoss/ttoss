import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/setup.ts'],
  moduleDirectories: ['node_modules', '<rootDir>/../..'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/../../src/$1',
    '^maplibre-gl$': '<rootDir>/__mocks__/maplibre-gl.ts',
  },
  coverageThreshold: {
    global: {
      statements: 91.13,
      branches: 82.11,
      functions: 96.26,
      lines: 93.97,
    },
  },
});
