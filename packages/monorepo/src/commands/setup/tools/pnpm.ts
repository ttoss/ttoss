import * as fs from 'fs';
import { Tool, executeCommand } from '../executeTools';

/**
 * https://dev.to/andreychernykh/yarn-npm-to-pnpm-migration-guide-2n04
 */
const removeYarnIfExists = async () => {
  /**
   * Check if yarn.lock exists
   */
  if (!fs.existsSync('yarn.lock')) {
    return;
  }

  executeCommand('npx npkill');

  /**
   * Remove workspaces from package.json
   */
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  delete packageJson.workspaces;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

  /**
   * Remove yarn.lock
   */
  fs.unlinkSync('yarn.lock');
};

const pnpmWorkspaceYaml = `
packages:
  - 'packages/**'
`;

const dotnpmrc = `
enable-pre-post-scripts=true
engine-strict=true
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*
# https://github.com/pnpm/pnpm/issues/4920#issuecomment-1226724790
public-hoist-pattern[]=@types*
`;

export const pnpm: Tool = async () => {
  executeCommand('npm install -g pnpm');

  await removeYarnIfExists();

  return {
    configFiles: [
      {
        name: 'pnpm-workspace.yaml',
        content: pnpmWorkspaceYaml,
      },
      {
        name: '.npmrc',
        content: dotnpmrc,
      },
    ],
    scripts: {
      preinstall: 'npx only-allow pnpm',
    },
  };
};
