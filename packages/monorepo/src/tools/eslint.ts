import * as fs from 'fs';

export const installPackages = ['@ttoss/eslint-config', 'eslint', 'prettier'];

const eslintrc = `
module.exports = {
  extends: '@ttoss/eslint-config',
};
`;

export const executeCommands = () => {
  fs.writeFileSync('.eslintrc.js', eslintrc);
};
