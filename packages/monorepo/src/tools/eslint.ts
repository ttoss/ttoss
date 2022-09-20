import * as fs from 'fs';

export const installPackages = [
  '@ttoss/config',
  '@ttoss/eslint-config',
  'eslint',
  'prettier',
];

const eslintrc = `
module.exports = {
  extends: '@ttoss/eslint-config',
};
`;

const prettierrc = `
const { prettierConfig } = require('@ttoss/config');

module.exports = prettierConfig();
`;

export const executeCommands = () => {
  fs.writeFileSync('.eslintrc.js', eslintrc);
  fs.writeFileSync('.prettierrc.js', prettierrc);
};
