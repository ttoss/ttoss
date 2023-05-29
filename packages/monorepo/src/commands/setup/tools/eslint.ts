import { Tool } from '../executeTools';

const dotEslintRcJs = `
module.exports = {
  extends: '@ttoss/eslint-config',
};
`;

const dotLintStagedRcJs = `
const { lintstagedConfig } = require('@ttoss/config');

module.exports = lintstagedConfig();
`;

const dotPrettierRcJs = `
const { prettierConfig } = require('@ttoss/config');

module.exports = prettierConfig();
`;

export const eslint: Tool = async () => {
  return {
    packages: [
      '@ttoss/config',
      '@ttoss/eslint-config',
      'eslint',
      'lint-staged',
      'prettier',
    ],
    huskyHooks: [['pre-commit', 'pnpm lint-staged']],
    scripts: {
      lint: 'lint-staged --diff main --quiet --no-stash',
    },
    configFiles: [
      {
        name: '.eslintrc.js',
        content: dotEslintRcJs,
      },
      {
        name: '.lintstagedrc.js',
        content: dotLintStagedRcJs,
      },
      {
        name: '.prettierignore',
        content: 'pnpm-lock.yaml',
      },
      {
        name: '.prettierrc.js',
        content: dotPrettierRcJs,
      },
    ],
  };
};
