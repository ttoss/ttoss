import fs from 'node:fs';
import path from 'node:path';

import { compile, extract } from '@formatjs/cli-lib';
import fg from 'fast-glob';
import minimist from 'minimist';

// Types and interfaces
interface PackageJson {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface TranslationData {
  [key: string]: {
    defaultMessage?: string;
    description?: string;
    module?: string;
  };
}

interface I18nConfig {
  defaultDir: string;
  extractDir: string;
  extractFile: string;
  compileDir: string;
  missingDir: string;
  unusedDir: string;
}

const DEFAULT_DIR = 'i18n';

const EXTRACT_DIR = path.join(DEFAULT_DIR, 'lang');

const EXTRACT_FILE = path.join(EXTRACT_DIR, 'en.json');

const COMPILE_DIR = path.join(DEFAULT_DIR, 'compiled');

const MISSING_DIR = path.join(DEFAULT_DIR, 'missing');

const UNUSED_DIR = path.join(DEFAULT_DIR, 'unused');

const argv = minimist(process.argv.slice(2));

// Configuration function
export const getI18nConfig = (): I18nConfig => {
  return {
    defaultDir: DEFAULT_DIR,
    extractDir: EXTRACT_DIR,
    extractFile: EXTRACT_FILE,
    compileDir: COMPILE_DIR,
    missingDir: MISSING_DIR,
    unusedDir: UNUSED_DIR,
  };
};

// Extract translations from source files
export const extractTranslationsFromSource = async (
  pattern: string,
  ignore: string[]
): Promise<string> => {
  return extract(fg.sync(pattern, { ignore }), {
    idInterpolationPattern: '[sha512:contenthash:base64:6]',
  });
};

export const getTtossExtractedTranslations =
  async (): Promise<TranslationData> => {
    // Read package.json to get dependencies
    const readPackageJson = async (): Promise<PackageJson> => {
      const packageJsonAsString = await fs.promises.readFile(
        path.join(process.cwd(), 'package.json')
      );
      return JSON.parse(packageJsonAsString.toString());
    };

    // Get ttoss dependencies from package.json
    const getTtossDependencies = (packageJson: PackageJson): string[] => {
      return Object.keys({
        ...packageJson.dependencies,
        ...packageJson.peerDependencies,
      })
        .filter((dependency) => {
          return dependency.startsWith('@ttoss');
        })
        .filter((dependency) => {
          return dependency !== '@ttoss/react-i18n';
        })
        .filter((dependency, index, array) => {
          return array.indexOf(dependency) === index;
        });
    };

    // Load translations from a ttoss dependency
    const loadDependencyTranslations = (
      dependency: string
    ): TranslationData => {
      try {
        const dependencyPath = path.join(
          process.cwd(),
          'node_modules',
          dependency
        );
        const config = getI18nConfig();
        const requirePath = path.join(dependencyPath, config.extractFile);

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const extractedTranslations = require(requirePath);

        return Object.keys(extractedTranslations).reduce((accumulator, key) => {
          accumulator[key] = {
            module: dependency,
            ...extractedTranslations[key],
          };
          return accumulator;
        }, {} as TranslationData);
      } catch {
        return {};
      }
    };

    const packageJson = await readPackageJson();
    const ttossDependencies = getTtossDependencies(packageJson);
    const ttossExtractedTranslations: TranslationData = {};

    for (const dependency of ttossDependencies) {
      const dependencyTranslations = loadDependencyTranslations(dependency);
      Object.assign(ttossExtractedTranslations, dependencyTranslations);
    }

    return ttossExtractedTranslations;
  };

// Compile translations
export const compileTranslations = async (
  config: I18nConfig
): Promise<void> => {
  const translations = fg.sync('**/*.json', {
    cwd: config.extractDir,
    absolute: true,
  });

  await fs.promises.mkdir(config.compileDir, { recursive: true });

  for (const translation of translations) {
    const filename = translation.split('/').pop();

    const compiledDataAsString = await compile([translation], {
      ast: true,
    });

    if (filename) {
      await fs.promises.writeFile(
        path.join(config.compileDir, filename),
        compiledDataAsString
      );
    }
  }
};

// Write final extracted data to file
export const writeFinalExtractedData = async (
  finalData: string,
  config: I18nConfig
): Promise<void> => {
  await fs.promises.mkdir(config.extractDir, { recursive: true });
  await fs.promises.writeFile(config.extractFile, finalData);
};

// Compare translations to find missing and unused
export const compareTranslations = (
  extractedTranslations: TranslationData,
  translationData: TranslationData
) => {
  const missingTranslations = Object.keys(extractedTranslations).reduce(
    (accumulator, key) => {
      if (!translationData[key]) {
        accumulator[key] = extractedTranslations[key];
      }
      return accumulator;
    },
    {} as TranslationData
  );

  const unusedTranslations = Object.keys(translationData).reduce(
    (accumulator, key) => {
      if (!extractedTranslations[key]) {
        accumulator[key] = translationData[key];
      }
      return accumulator;
    },
    {} as TranslationData
  );

  const cleanTranslations = Object.keys(translationData).reduce(
    (accumulator, key) => {
      if (extractedTranslations[key]) {
        accumulator[key] = translationData[key];
      }
      return accumulator;
    },
    {} as TranslationData
  );

  return { missingTranslations, unusedTranslations, cleanTranslations };
};

// Write missing translations to file
export const writeMissingTranslations = async (
  filename: string,
  missingTranslations: TranslationData,
  config: I18nConfig
): Promise<void> => {
  await fs.promises.writeFile(
    path.join(config.missingDir, filename),
    JSON.stringify(missingTranslations, undefined, 2)
  );
};

// Write unused translations to file
export const writeUnusedTranslations = async (
  filename: string,
  unusedTranslations: TranslationData,
  config: I18nConfig
): Promise<void> => {
  try {
    const existingUnusedData = await fs.promises.readFile(
      path.join(config.unusedDir, filename)
    );
    const existingUnused = JSON.parse(existingUnusedData.toString());

    const updatedUnused = {
      ...existingUnused,
      ...unusedTranslations,
    };

    await fs.promises.writeFile(
      path.join(config.unusedDir, filename),
      JSON.stringify(updatedUnused, undefined, 2)
    );
  } catch {
    await fs.promises.writeFile(
      path.join(config.unusedDir, filename),
      JSON.stringify(unusedTranslations, undefined, 2)
    );
  }
};

// Write clean translations back to the lang directory
export const writeCleanTranslations = async (
  filename: string,
  cleanTranslations: TranslationData,
  config: I18nConfig
): Promise<void> => {
  await fs.promises.writeFile(
    path.join(config.extractDir, filename),
    JSON.stringify(cleanTranslations, undefined, 2)
  );
};

// Analyze missing and unused translations
export const analyzeMissingAndUnusedTranslations = async (
  finalExtractedData: string,
  config: I18nConfig
): Promise<void> => {
  const translations = fg.sync('**/*.json', {
    cwd: config.extractDir,
    absolute: true,
  });

  await fs.promises.mkdir(config.missingDir, { recursive: true });
  await fs.promises.mkdir(config.unusedDir, { recursive: true });

  const extractedTranslations = JSON.parse(finalExtractedData);

  for (const translation of translations) {
    const filename = translation.split('/').pop();

    if (filename === 'en.json') {
      continue;
    }

    const translationData = JSON.parse(
      fs.readFileSync(translation, { encoding: 'utf8' })
    );

    const { missingTranslations, unusedTranslations, cleanTranslations } =
      compareTranslations(extractedTranslations, translationData);

    if (filename) {
      await writeMissingTranslations(filename, missingTranslations, config);
      await writeUnusedTranslations(filename, unusedTranslations, config);
      await writeCleanTranslations(filename, cleanTranslations, config);
    }
  }
};

export const executeI18nCli = async () => {
  const config = getI18nConfig();
  const pattern = argv.pattern || 'src/**/*.{ts,tsx}';
  const ignore = argv.ignore || ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'];
  const ignoreTtossPackages = argv['ignore-ttoss-packages'];

  // Extract translations from source files
  const extractedDataAsString = await extractTranslationsFromSource(
    pattern,
    ignore
  );

  // Get ttoss package translations if not ignored
  const ttossExtractedTranslations = ignoreTtossPackages
    ? {}
    : await getTtossExtractedTranslations();

  // Merge extracted data with ttoss translations
  const finalExtractedData = (() => {
    if (ignoreTtossPackages) {
      return extractedDataAsString;
    }

    const parsedExtractedData = JSON.parse(extractedDataAsString);
    const finalData = {
      ...parsedExtractedData,
      ...ttossExtractedTranslations,
    };

    return JSON.stringify(finalData, undefined, 2);
  })();

  // Write final extracted data to file
  await writeFinalExtractedData(finalExtractedData, config);

  // Skip compilation if requested
  if (argv['no-compile']) {
    return;
  }

  // Compile translations
  await compileTranslations(config);

  // Analyze missing and unused translations
  await analyzeMissingAndUnusedTranslations(finalExtractedData, config);
};
