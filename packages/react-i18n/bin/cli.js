#!/usr/bin/env node

const { compile, extract } = require('@formatjs/cli');
const fs = require('fs');
const glob = require('glob');
const path = require('path');

const DEFAULT_DIR = 'i18n';

const EXTRACT_DIR = path.join(DEFAULT_DIR, 'lang');

const COMPILE_DIR = path.join(DEFAULT_DIR, 'compiled-lang');

const args = process.argv.slice(2);

(async () => {
  /**
   * Extract
   */
  const extractedDataAsString = await extract(glob.sync('src/**/*.{ts,tsx}'), {
    idInterpolationPattern: '[sha512:contenthash:base64:6]',
  });

  await fs.promises.mkdir(EXTRACT_DIR, { recursive: true });

  await fs.promises.writeFile(
    path.join(EXTRACT_DIR, 'en.json'),
    extractedDataAsString
  );

  if (args.includes('--no-compile')) {
    return;
  }

  /**
   * Compile
   */
  await fs.promises.mkdir(COMPILE_DIR, {
    recursive: true,
  });

  const translations = glob.sync(EXTRACT_DIR + '/*.json');

  for (const translation of translations) {
    const filename = translation.split('/').pop();

    const compiledDataAsString = await compile([translation], {
      ast: true,
    });

    await fs.promises.writeFile(
      path.join(COMPILE_DIR, filename),
      compiledDataAsString
    );
  }
})();
