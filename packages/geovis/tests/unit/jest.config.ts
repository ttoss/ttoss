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
      statements: 96.55,
      branches: 89.65,
      functions: 98.75,
      lines: 98.35,
    },
  },
});
