import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { compile } from '@formatjs/cli-lib';
import minimist from 'minimist';

import {
  DEFAULT_SCOPES,
  DEFAULT_SOURCE_LOCALE,
  getI18nConfig,
  type I18nConfig,
  type TranslationData,
} from './config';
import {
  type DependencyCatalog,
  getDependencyCatalogs,
  getDependencyMessagesForLocale,
  getDependencySourceMessages,
} from './dependencies';
import {
  type DuplicateId,
  extractTranslationsFromSource,
  findDuplicateIds,
  findGeneratedIds,
  type GeneratedIdViolation,
} from './extract';

export {
  DEFAULT_SCOPES,
  DEFAULT_SOURCE_LOCALE,
  getI18nConfig,
  type I18nConfig,
  ID_INTERPOLATION_PATTERN,
  PRESERVE_WHITESPACE,
  type TranslationData,
} from './config';
export {
  type DependencyCatalog,
  findPackageDir,
  getDependencyCatalogs,
  getDependencyMessagesForLocale,
  getDependencySourceMessages,
  readDependencyCatalog,
} from './dependencies';
export {
  extractTranslationsFromSource,
  findDuplicateIds,
  findGeneratedIds,
} from './extract';

export type I18nCliOptions = {
  cwd: string;
  pattern: string | string[];
  ignore: string[];
  sourceLocale: string;
  scopes: string[];
  ignoreDependencies: boolean;
  compile: boolean;
  explicitIds: string[];
  locales?: string[];
};

const toList = (value: unknown): string[] | undefined => {
  if (value === undefined || value === true || value === false) {
    return undefined;
  }

  return (Array.isArray(value) ? value : [value])
    .flatMap((item) => {
      return String(item).split(',');
    })
    .map((item) => {
      return item.trim();
    })
    .filter(Boolean);
};

export const parseOptions = ({
  argv,
  cwd = process.cwd(),
}: {
  argv: minimist.ParsedArgs;
  cwd?: string;
}): I18nCliOptions => {
  return {
    cwd,
    pattern: argv.pattern || 'src/**/*.{ts,tsx}',
    ignore: toList(argv.ignore) ?? ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
    sourceLocale: argv['source-locale'] || DEFAULT_SOURCE_LOCALE,
    scopes: toList(argv.scope) ?? DEFAULT_SCOPES,
    ignoreDependencies: Boolean(
      argv['ignore-dependencies'] || argv['ignore-ttoss-packages']
    ),
    // minimist reads `--no-compile` as `compile: false`.
    compile: argv.compile !== false,
    explicitIds: toList(argv['explicit-ids']) ?? [],
    locales: toList(argv.locales),
  };
};

const writeJson = async (file: string, data: unknown) => {
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await fs.promises.writeFile(file, JSON.stringify(data, undefined, 2));
};

const readJsonIfExists = (file: string): TranslationData | undefined => {
  if (!fs.existsSync(file)) {
    return undefined;
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};

/**
 * Locales with a file in `i18n/lang`, the source locale included.
 */
export const getLangLocales = (config: I18nConfig) => {
  if (!fs.existsSync(config.extractDir)) {
    return [];
  }

  return fs
    .readdirSync(config.extractDir)
    .filter((file) => {
      return file.endsWith('.json');
    })
    .map((file) => {
      return file.slice(0, -'.json'.length);
    })
    .sort();
};

export type ExtractionResult = {
  config: I18nConfig;
  own: TranslationData;
  catalogs: DependencyCatalog[];
  /** The source catalog: own messages plus every dependency's, own winning. */
  source: TranslationData;
  generatedIds: GeneratedIdViolation[];
  duplicates: DuplicateId[];
};

export const runExtraction = async (
  options: I18nCliOptions
): Promise<ExtractionResult> => {
  const config = getI18nConfig({
    cwd: options.cwd,
    sourceLocale: options.sourceLocale,
  });

  const own = await extractTranslationsFromSource({
    cwd: options.cwd,
    pattern: options.pattern,
    ignore: options.ignore,
  });

  const generatedIds =
    options.explicitIds.length > 0
      ? await findGeneratedIds({
          cwd: options.cwd,
          explicitIds: options.explicitIds,
          ignore: options.ignore,
        })
      : [];

  const catalogs = options.ignoreDependencies
    ? []
    : getDependencyCatalogs({ cwd: options.cwd, scopes: options.scopes });

  const dependencySource = getDependencySourceMessages({
    catalogs,
    locale: options.sourceLocale,
  });

  const source: TranslationData = { ...own };
  for (const [id, entry] of Object.entries(dependencySource)) {
    source[id] ??= entry;
  }

  const duplicates = findDuplicateIds([
    { module: '.', messages: own },
    ...catalogs.map((catalog) => {
      return {
        module: catalog.module,
        messages: catalog.locales[catalog.sourceLocale],
      };
    }),
  ]);

  return { config, own, catalogs, source, generatedIds, duplicates };
};

/**
 * The messages compiled for `locale`: what the dependencies provide for it,
 * overridden by the package's own `i18n/lang/<locale>.json`.
 */
export const getMessagesForLocale = ({
  extraction,
  locale,
}: {
  extraction: ExtractionResult;
  locale: string;
}): TranslationData => {
  const { config, catalogs, source } = extraction;

  if (locale === config.sourceLocale) {
    return source;
  }

  const own =
    readJsonIfExists(path.join(config.extractDir, `${locale}.json`)) ?? {};

  return {
    ...getDependencyMessagesForLocale({ catalogs, locale }),
    ...own,
  };
};

export const compileTranslations = async (extraction: ExtractionResult) => {
  const { config } = extraction;
  const tmpDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), 'ttoss-i18n-')
  );

  try {
    await fs.promises.mkdir(config.compileDir, { recursive: true });

    for (const locale of getLangLocales(config)) {
      const merged = path.join(tmpDir, `${locale}.json`);
      await writeJson(merged, getMessagesForLocale({ extraction, locale }));
      await fs.promises.writeFile(
        path.join(config.compileDir, `${locale}.json`),
        await compile([merged], { ast: true })
      );
    }
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  }
};

export const compareTranslations = ({
  source,
  translation,
  provided = {},
}: {
  source: TranslationData;
  translation: TranslationData;
  /** Ids a dependency already translates, so they are not missing. */
  provided?: TranslationData;
}) => {
  const missingTranslations: TranslationData = {};
  const unusedTranslations: TranslationData = {};
  const cleanTranslations: TranslationData = {};

  for (const id of Object.keys(source)) {
    if (!translation[id] && !provided[id]) {
      missingTranslations[id] = source[id];
    }
  }

  for (const [id, entry] of Object.entries(translation)) {
    if (source[id]) {
      cleanTranslations[id] = entry;
    } else {
      unusedTranslations[id] = entry;
    }
  }

  return { missingTranslations, unusedTranslations, cleanTranslations };
};

/**
 * Write `i18n/missing/<locale>.json` and append to `i18n/unused/<locale>.json`
 * for every translation file, and drop unused ids from the translation file.
 */
export const analyzeMissingAndUnusedTranslations = async (
  extraction: ExtractionResult
) => {
  const { config, catalogs, source } = extraction;

  for (const locale of getLangLocales(config)) {
    if (locale === config.sourceLocale) {
      continue;
    }

    const file = `${locale}.json`;
    const translation =
      readJsonIfExists(path.join(config.extractDir, file)) ?? {};

    const { missingTranslations, unusedTranslations, cleanTranslations } =
      compareTranslations({
        source,
        translation,
        provided: getDependencyMessagesForLocale({ catalogs, locale }),
      });

    await writeJson(path.join(config.missingDir, file), missingTranslations);
    await writeJson(path.join(config.unusedDir, file), {
      ...readJsonIfExists(path.join(config.unusedDir, file)),
      ...unusedTranslations,
    });
    await writeJson(path.join(config.extractDir, file), cleanTranslations);
  }
};

const formatGeneratedIds = (generatedIds: GeneratedIdViolation[]) => {
  return generatedIds
    .map(({ id, defaultMessage }) => {
      return `  - ${id}: ${JSON.stringify(defaultMessage)}`;
    })
    .join('\n');
};

/**
 * `ttoss-i18n`: extract the source catalog, then compile every locale and
 * report what is missing and unused.
 */
export const runBuild = async (options: I18nCliOptions) => {
  const extraction = await runExtraction(options);
  const { config, source, generatedIds } = extraction;

  if (generatedIds.length > 0) {
    throw new Error(
      `ttoss-i18n: messages in ${options.explicitIds.join(', ')} must have an explicit id, because references to them are persisted:\n${formatGeneratedIds(generatedIds)}`
    );
  }

  await writeJson(config.extractFile, source);

  if (config.sourceLocale === DEFAULT_SOURCE_LOCALE) {
    await fs.promises.rm(config.manifestFile, { force: true });
  } else {
    await writeJson(config.manifestFile, { sourceLocale: config.sourceLocale });
  }

  if (!options.compile) {
    return extraction;
  }

  await compileTranslations(extraction);
  await analyzeMissingAndUnusedTranslations(extraction);

  return extraction;
};

export type CheckResult = {
  ok: boolean;
  missing: Record<string, string[]>;
  duplicates: DuplicateId[];
  generatedIds: GeneratedIdViolation[];
};

const findMissing = ({
  extraction,
  locales,
}: {
  extraction: ExtractionResult;
  locales: string[];
}) => {
  const { config, catalogs, source } = extraction;
  const missing: Record<string, string[]> = {};

  for (const locale of locales) {
    const { missingTranslations } = compareTranslations({
      source,
      translation:
        readJsonIfExists(path.join(config.extractDir, `${locale}.json`)) ?? {},
      provided: getDependencyMessagesForLocale({ catalogs, locale }),
    });
    const ids = Object.keys(missingTranslations);
    if (ids.length > 0) {
      missing[locale] = ids;
    }
  }

  return missing;
};

const MAX_LISTED = 20;

const describeProblems = ({
  extraction,
  missing,
  explicitIds,
}: {
  extraction: ExtractionResult;
  missing: Record<string, string[]>;
  explicitIds: string[];
}) => {
  const { source, duplicates, generatedIds } = extraction;
  const problems: string[] = [];

  for (const [locale, ids] of Object.entries(missing)) {
    const listed = ids
      .slice(0, MAX_LISTED)
      .map((id) => {
        return `  - ${id}: ${JSON.stringify(source[id]?.defaultMessage)}`;
      })
      .join('\n');
    const more =
      ids.length > MAX_LISTED
        ? `\n  … and ${ids.length - MAX_LISTED} more`
        : '';
    problems.push(
      `${ids.length} message(s) missing a ${locale} translation:\n${listed}${more}`
    );
  }

  for (const { id, modules } of duplicates) {
    problems.push(
      `id ${id} is declared with different text by ${modules.join(', ')}`
    );
  }

  if (generatedIds.length > 0) {
    problems.push(
      `${generatedIds.length} message(s) in ${explicitIds.join(', ')} need an explicit id:\n${formatGeneratedIds(generatedIds)}`
    );
  }

  return problems;
};

/**
 * `ttoss-i18n check`: fail CI when a required locale is missing a
 * translation, an id is declared twice with different text, or a persisted
 * message has no explicit id. Writes nothing.
 */
export const runCheck = async (
  options: I18nCliOptions,
  log: Pick<Console, 'log' | 'error'> = console
): Promise<CheckResult> => {
  const extraction = await runExtraction(options);
  const { config, source, duplicates, generatedIds } = extraction;

  const locales = (options.locales ?? getLangLocales(config)).filter(
    (locale) => {
      return locale !== config.sourceLocale;
    }
  );

  const missing = findMissing({ extraction, locales });
  const problems = describeProblems({
    extraction,
    missing,
    explicitIds: options.explicitIds,
  });
  const ok = problems.length === 0;

  if (ok) {
    log.log(
      `ttoss-i18n check: ${Object.keys(source).length} messages, ${locales.length} locale(s) checked, no problems.`
    );
  } else {
    log.error(`ttoss-i18n check failed:\n\n${problems.join('\n\n')}`);
  }

  return { ok, missing, duplicates, generatedIds };
};

export const executeI18nCli = async (
  args: string[] = process.argv.slice(2),
  cwd: string = process.cwd()
) => {
  const argv = minimist(args);
  const options = parseOptions({ argv, cwd });

  if (argv._[0] === 'check') {
    const result = await runCheck(options);
    if (!result.ok) {
      process.exitCode = 1;
    }
    return result;
  }

  return runBuild(options);
};
