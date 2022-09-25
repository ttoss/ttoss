import * as fs from 'fs';

export const installPackages = ['turbo'];

const turboJson = `
{
  "$schema": "https://turborepo.org/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": [],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts", "test/**/*.tsx"]
    },
    "lint": {
      "outputs": []
    },
    "deploy": {
      "dependsOn": ["build", "test", "lint", "^deploy"],
      "outputs": []
    }
  }
}
`;

export const executeCommands = () => {
  if (!fs.existsSync('turbo.json')) {
    fs.writeFileSync('turbo.json', turboJson);
  }
};
