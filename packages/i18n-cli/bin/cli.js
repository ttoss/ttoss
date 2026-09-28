#!/usr/bin/env node

const { executeI18nCli } = require('../dist/index.cjs');

executeI18nCli().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error.message);
  process.exitCode = 1;
});
