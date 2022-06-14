module.exports = {
  '*.{js,jsx,ts,tsx}':
    'eslint --fix -c node_modules/@ttoss/monorepo/config/eslintrc.js',
  '*.{md,mdx,html,json,yml,yaml}': 'prettier --write',
};
