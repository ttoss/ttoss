/**
 * Setup test structure following ttoss testing guidelines.
 * Guide: https://ttoss.dev/docs/engineering/guidelines/tests
 * Update docs/website/docs/engineering/06-guidelines/tests.md if you
 * make changes here.
 */
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { createDirectory, createFile } from './utils';

const rootJestConfig = `import { jestRootConfig } from '@ttoss/config';

export default jestRootConfig();
`;

const unitJestConfig = `import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      lines: 50,
      functions: 50,
      branches: 50,
      statements: 50,
    },
  },
});
`;

const e2eJestConfig = `import { jestE2EConfig } from '@ttoss/config';

export default jestE2EConfig();
`;

const babelConfig = `const { babelConfig } = require('@ttoss/config');

const config = babelConfig({});

module.exports = config;
`;

const tsconfigJson = `{
  "extends": "@ttoss/config/tsconfig.test.json",
  "compilerOptions": {
    "paths": {
      "src/*": ["../src/*"],
      "tests/*": ["./*"]
    }
  }
}
`;

const sampleTest = `/**
 * Sample test to verify test setup is working correctly.
 * You can delete this file once you start writing your own tests.
 */
describe('Test Setup', () => {
  test('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  test('should be able to perform basic assertions', () => {
    const sum = (a: number, b: number) => {
      return a + b;
    };
    expect(sum(2, 2)).toBe(4);
  });
});

`;

const installDependencies = ({ dir }: { dir: string }) => {
  const packageJsonPath = path.join(dir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    // eslint-disable-next-line no-console
    console.log('⚠ package.json not found, skipping dependency installation');
    return;
  }

  // eslint-disable-next-line no-console
  console.log('\n📦 Installing dependencies...');

  try {
    execSync('pnpm add -D jest @ttoss/config', {
      cwd: dir,
      stdio: 'inherit',
    });
    // eslint-disable-next-line no-console
    console.log('✓ Installed jest and @ttoss/config');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('✗ Failed to install dependencies:', error);
    // eslint-disable-next-line no-console
    console.log('  You can install them manually with:');
    // eslint-disable-next-line no-console
    console.log('  pnpm add -D jest @ttoss/config');
  }
};

const updatePackageJson = ({
  dir,
  includeE2E,
}: {
  dir: string;
  includeE2E: boolean;
}) => {
  const packageJsonPath = path.join(dir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    // eslint-disable-next-line no-console
    console.log('⚠ package.json not found, skipping script updates');
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  let updated = false;
  packageJson.scripts = packageJson.scripts || {};

  // Always set/update test script to use Jest
  const currentTestScript = packageJson.scripts.test || '';
  if (
    !currentTestScript ||
    currentTestScript.includes('Error: no test specified') ||
    currentTestScript.includes('echo') ||
    currentTestScript === 'exit 1'
  ) {
    packageJson.scripts.test = 'jest --projects tests/unit';
    // eslint-disable-next-line no-console
    console.log('✓ Added "test" script to package.json');
    updated = true;
  }

  // Add e2e script if e2e option is enabled and script doesn't exist
  if (includeE2E && !packageJson.scripts.e2e) {
    packageJson.scripts.e2e = 'jest --projects tests/e2e';
    // eslint-disable-next-line no-console
    console.log('✓ Added "e2e" script to package.json');
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + '\n'
    );
  } else {
    // eslint-disable-next-line no-console
    console.log('- Test scripts already configured in package.json');
  }
};

export const setupTests = ({
  dir,
  e2e = false,
}: {
  dir: string;
  e2e?: boolean;
}) => {
  const absoluteDir = path.resolve(dir);
  const includeE2E = e2e;

  // eslint-disable-next-line no-console
  console.log(`\nSetting up tests in: ${absoluteDir}\n`);

  // Create directory structure
  createDirectory({ dirPath: path.join(absoluteDir, 'tests') });
  createDirectory({ dirPath: path.join(absoluteDir, 'tests/unit') });
  createDirectory({ dirPath: path.join(absoluteDir, 'tests/unit/tests') });

  if (includeE2E) {
    createDirectory({ dirPath: path.join(absoluteDir, 'tests/e2e') });
    createDirectory({ dirPath: path.join(absoluteDir, 'tests/e2e/tests') });
  }

  // Create root jest config
  createFile({
    filePath: path.join(absoluteDir, 'jest.config.ts'),
    content: rootJestConfig,
  });

  // Create unit test configs
  createFile({
    filePath: path.join(absoluteDir, 'tests/unit/jest.config.ts'),
    content: unitJestConfig,
  });
  createFile({
    filePath: path.join(absoluteDir, 'tests/unit/babel.config.cjs'),
    content: babelConfig,
  });

  // Create sample test file
  createFile({
    filePath: path.join(absoluteDir, 'tests/unit/tests/setup.test.ts'),
    content: sampleTest,
  });

  // Create e2e test configs
  if (includeE2E) {
    createFile({
      filePath: path.join(absoluteDir, 'tests/e2e/jest.config.ts'),
      content: e2eJestConfig,
    });
    createFile({
      filePath: path.join(absoluteDir, 'tests/e2e/babel.config.cjs'),
      content: babelConfig,
    });

    // Create sample e2e test file
    createFile({
      filePath: path.join(absoluteDir, 'tests/e2e/tests/setup.test.ts'),
      content: sampleTest,
    });
  }

  // Create tests tsconfig
  createFile({
    filePath: path.join(absoluteDir, 'tests/tsconfig.json'),
    content: tsconfigJson,
  });

  // Update package.json with test scripts
  updatePackageJson({ dir: absoluteDir, includeE2E });

  // Install dependencies
  installDependencies({ dir: absoluteDir });

  // eslint-disable-next-line no-console
  console.log('\n✅ Test setup complete!');
  // eslint-disable-next-line no-console
  console.log('\nNext steps:');
  // eslint-disable-next-line no-console
  console.log('1. Run "pnpm test" to verify the setup is working');
  // eslint-disable-next-line no-console
  console.log('2. Write your unit tests in tests/unit/tests/');
  // eslint-disable-next-line no-console
  console.log(
    '3. Delete tests/unit/tests/setup.test.ts once you have real tests'
  );

  if (includeE2E) {
    // eslint-disable-next-line no-console
    console.log('4. Write your e2e tests in tests/e2e/tests/');
    // eslint-disable-next-line no-console
    console.log('5. Run "pnpm e2e" for e2e tests');
    // eslint-disable-next-line no-console
    console.log(
      '6. Delete tests/e2e/tests/setup.test.ts once you have real e2e tests'
    );
  }

  // eslint-disable-next-line no-console
  console.log('');
};
