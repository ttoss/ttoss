import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import { compile, extract } from '@formatjs/cli-lib';

const DEFAULT_DIR = 'i18n';

const EXTRACT_DIR = path.join(DEFAULT_DIR, 'lang');

const EXTRACT_FILE = path.join(EXTRACT_DIR, 'en.json');

const COMPILE_DIR = path.join(DEFAULT_DIR, 'compiled-lang');

const args = process.argv.slice(2);

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
  const ttossDependencies = Object.keys(
    {
      ...packageJson.dependencies,
      ...packageJson.peerDependencies,
    } || {}
  )
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
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const extractedTranslations = require(path.join(
        dependency,
        EXTRACT_FILE
      ));

      /**
       * Add "module: dependency" to the extracted translations
       */
      const extractedTranslationsWithModule = Object.keys(
        extractedTranslations
      ).reduce((acc, key) => {
        return {
          ...acc,
          [key]: {
            ...extractedTranslations[key],
            module: dependency,
          },
        };
      }, {});

      Object.assign(
        ttossExtractedTranslations,
        extractedTranslationsWithModule
      );
    } catch (error) {
      continue;
    }
  }

  return ttossExtractedTranslations;
};

(async () => {
  /**
   * Extract
   */
  const extractedDataAsString = await extract(
    glob.sync('src/**/*.{ts,tsx}', {
      ignore: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
    }),
    {
      idInterpolationPattern: '[sha512:contenthash:base64:6]',
    }
  );

  const ignoreTtossPackages = args.includes('--ignore-ttoss-packages');

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

    return JSON.stringify(finalExtractedData, null, 2);
  })();

  await fs.promises.mkdir(EXTRACT_DIR, { recursive: true });

  await fs.promises.writeFile(EXTRACT_FILE, finalExtractedData);

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

    if (filename) {
      await fs.promises.writeFile(
        path.join(COMPILE_DIR, filename),
        compiledDataAsString
      );
    }
  }
})();
