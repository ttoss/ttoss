import fs from 'node:fs';
import path from 'node:path';

import { compile, extract } from '@formatjs/cli-lib';
import fg from 'fast-glob';
import minimist from 'minimist';

const DEFAULT_DIR = 'i18n';

const EXTRACT_DIR = path.join(DEFAULT_DIR, 'lang');

const EXTRACT_FILE = path.join(EXTRACT_DIR, 'en.json');

const COMPILE_DIR = path.join(DEFAULT_DIR, 'compiled');

const MISSING_DIR = path.join(DEFAULT_DIR, 'missing');

const UNUSED_DIR = path.join(DEFAULT_DIR, 'unused');

const argv = minimist(process.argv.slice(2));

const getTtossExtractedTranslations = async () => {
  /**
   * Read process cwd package.json to get the list of dependencies.
   */
  const packageJsonAsString = await fs.promises.readFile(
    path.join(process.cwd(), 'package.json')
  );

  const packageJson = JSON.parse(packageJsonAsString.toString());
  /**
   * Get all dependencies and devDependencies that start with "@ttoss"
   */
  const ttossDependencies = Object.keys({
    ...packageJson.dependencies,
    ...packageJson.peerDependencies,
  })
    .filter((dependency) => {
      return dependency.startsWith('@ttoss');
    })
    /**
     * Ignore @ttoss/react-i18n because its i18n is for tests only.
     */
    .filter((dependency) => {
      return dependency !== '@ttoss/react-i18n';
    })
    /**
     * Remove duplicates
     */

    .filter((dependency, index, array) => {
      return array.indexOf(dependency) === index;
    });
  /**
   * For each package, read the i18n/lang/en.json file and merge them.
   */
  const ttossExtractedTranslations = {};

  for (const dependency of ttossDependencies) {
    try {
      const dependencyPathFromCwd = path.join(
        process.cwd(),
        'node_modules',
        dependency
      );
      const requirePath = path.join(dependencyPathFromCwd, EXTRACT_FILE);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const extractedTranslations = require(requirePath);
      /**
       * Add "module: dependency" to the extracted translations
       */
      const extractedTranslationsWithModule = Object.keys(
        extractedTranslations
      ).reduce(
        (accumulator, key) => {
          accumulator[key] = {
            module: dependency,
            ...extractedTranslations[key],
          };
          return accumulator;
        },
        {} as Record<string, Record<string, string>>
      );

      Object.assign(
        ttossExtractedTranslations,
        extractedTranslationsWithModule
      );
    } catch {
      continue;
    }
  }

  return ttossExtractedTranslations;
};

const executeI18nCli = async () => {
  /**
   * Extract
   */

  const pattern = argv.pattern || 'src/**/*.{ts,tsx}';

  const ignore = argv.ignore || ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'];

  const extractedDataAsString = await extract(fg.sync(pattern, { ignore }), {
    idInterpolationPattern: '[sha512:contenthash:base64:6]',
  });

  const ignoreTtossPackages = argv['ignore-ttoss-packages'];

  const ttossExtractedTranslations = await getTtossExtractedTranslations();

  const finalExtractedData = (() => {
    if (ignoreTtossPackages) {
      return extractedDataAsString;
    }

    const parsedExtractedData = JSON.parse(extractedDataAsString);

    const finalExtractedData = {
      ...parsedExtractedData,
      ...ttossExtractedTranslations,
    };

    return JSON.stringify(finalExtractedData, undefined, 2);
  })();

  await fs.promises.mkdir(EXTRACT_DIR, { recursive: true });

  await fs.promises.writeFile(EXTRACT_FILE, finalExtractedData);

  if (argv['no-compile']) {
    return;
  }

  /**
   * Compile
   */
  const translations = fg.sync('**/*.json', {
    cwd: EXTRACT_DIR,
    absolute: true,
  });

  await fs.promises.mkdir(COMPILE_DIR, {
    recursive: true,
  });

  for (const translation of translations) {
    const filename = translation.split('/').pop();

    const compiledDataAsString = await compile([translation], {
      ast: true,
    });

    if (filename) {
      await fs.promises.writeFile(
        path.join(COMPILE_DIR, filename),
        compiledDataAsString
      );
    }
  }
  /**
   * Missing
   */
  await fs.promises.mkdir(MISSING_DIR, {
    recursive: true,
  });

  /**
   * Unused
   */
  await fs.promises.mkdir(UNUSED_DIR, {
    recursive: true,
  });

  for (const translation of translations) {
    const filename = translation.split('/').pop();

    /**
     * Ignore en.json
     */
    if (filename === 'en.json') {
      continue;
    }

    const extractedTranslations = JSON.parse(finalExtractedData);

    const object = JSON.parse(
      fs.readFileSync(translation, { encoding: 'utf8' })
    );

    /**
     * List all missing translations that exist in en.json but not in the current translation.
     */
    const missingTranslations = Object.keys(extractedTranslations).reduce(
      (accumulator, key) => {
        if (!object[key]) {
          accumulator[key] = extractedTranslations[key];
        }

        return accumulator;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as Record<string, any>
    );

    /**
     * generate file with translations that doesnt exist in lang/en.json
     */
    const unusedTranslations = Object.keys(object).reduce(
      (accumulator, key) => {
        if (!extractedTranslations[key]) {
          accumulator[key] = object[key];
        }

        return accumulator;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as Record<string, any>
    );

    /**
     * generate list without unnecessary translations
     */
    const withoutUnnecessaryTranslations = Object.keys(object).reduce(
      (accumulator, key) => {
        if (object[key] !== unusedTranslations[key]) {
          accumulator[key] = object[key];
        }

        return accumulator;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as Record<string, any>
    );

    if (filename) {
      await fs.promises.writeFile(
        path.join(MISSING_DIR, filename),
        JSON.stringify(missingTranslations, undefined, 2)
      );

      /**
       * Read unused file to get all old unused translation
       */
      try {
        const existentUnusedJsonAsString = await fs.promises.readFile(
          path.join(UNUSED_DIR, filename)
        );

        if (existentUnusedJsonAsString) {
          const existentUnusedJson = JSON.parse(
            existentUnusedJsonAsString.toString()
          );

          /**
           * append existent unused translations and news unused translations
           */
          const updatedUnusedTranslations = {
            ...existentUnusedJson,
            ...unusedTranslations,
          };

          /**
           * add Unused translations
           */
          await fs.promises.writeFile(
            path.join(UNUSED_DIR, filename),
            JSON.stringify(updatedUnusedTranslations, undefined, 2)
          );
        }
      } catch {
        /**
         * add Unused translations
         */
        await fs.promises.writeFile(
          path.join(UNUSED_DIR, filename),
          JSON.stringify(unusedTranslations, undefined, 2)
        );
      }

      /**
       * remove unnecessary translations from lang/filename
       */
      await fs.promises.writeFile(
        path.join(EXTRACT_DIR, filename),
        JSON.stringify(withoutUnnecessaryTranslations, undefined, 2)
      );
    }
  }
};

executeI18nCli();
