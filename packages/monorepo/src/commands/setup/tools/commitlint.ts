import { Tool } from '../executeTools';

const dotCommitlintrcJs = `
const { commitlintConfig } = require('@ttoss/config');

module.exports = commitlintConfig();
`;

export const commitlint: Tool = async () => {
  return {
    packages: ['@commitlint/cli', '@commitlint/config-conventional'],
    configFiles: [
      {
        name: '.commitlintrc.js',
        content: dotCommitlintrcJs,
      },
    ],
    huskyHooks: [['commit-msg', 'pnpm commitlint --edit']],
  };
};
