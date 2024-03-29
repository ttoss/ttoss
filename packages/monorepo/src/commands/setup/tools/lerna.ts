import * as fs from 'fs';

export const installPackages = ['@lerna-lite/cli', '@lerna-lite/list'];

const lernaJson = `
{
  "version": "independent",
  "npmClient": "pnpm",
  "useWorkspaces": true,
  "stream": true,
  "command": {
    "publish": {
      "allowBranch": "main",
      "conventionalCommits": true,
      "ignoreChanges": [
        "**/docs/**",
        "**/__fixtures__/**",
        "**/__tests__/**",
        "**/*.md"
      ],
      "message": "chore(release): publish packages",
      "noPrivate": true
    }
  }
}
`;

export const executeCommands = () => {
  fs.writeFileSync('lerna.json', lernaJson);
};

export const scripts = {
  ls: 'lerna ls',
};
