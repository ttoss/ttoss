import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

export default jestUnitConfig({
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/setup.ts'],
  // Transpile ESM-only dependencies (react-intl, via @ttoss/react-i18n).
  transformIgnorePatterns: getTransformIgnorePatterns(),
  moduleDirectories: ['node_modules', '<rootDir>/../..'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/../../src/$1',
    '^maplibre-gl$': '<rootDir>/__mocks__/maplibre-gl.ts',
  },
  coverageThreshold: {
    global: {
      statements: 97.0,
      branches: 90.7,
      functions: 98.95,
      lines: 98.65,
    },
  },
});
