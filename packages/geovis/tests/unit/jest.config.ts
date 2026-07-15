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
      statements: 91.8,
      branches: 82.95,
      functions: 96.7,
      lines: 94.65,
    },
  },
});
