import { Tool } from '../executeTools';

const dotSyncpackRcJs = `
const { syncpackConfig } = require('@ttoss/config');

module.exports = syncpackConfig();
`;

export const syncpack: Tool = async ({ syncpack }) => {
  if (!syncpack) {
    return {};
  }

  return {
    packages: ['syncpack'],
    configFiles: [
      {
        name: '.syncpackrc.js',
        content: dotSyncpackRcJs,
      },
    ],
    scripts: {
      'syncpack:fix': 'syncpack fix-mismatches',
      'syncpack:list': 'syncpack list-mismatches',
    },
    huskyHooks: [['pre-commit', 'pnpm syncpack:list']],
  };
};
