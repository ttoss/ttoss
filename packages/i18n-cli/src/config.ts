import path from 'node:path';

export type TranslationData = {
  [id: string]: {
    defaultMessage?: string;
    description?: string;
    module?: string;
  };
};

export type I18nConfig = {
  cwd: string;
  sourceLocale: string;
  defaultDir: string;
  extractDir: string;
  extractFile: string;
  manifestFile: string;
  compileDir: string;
  missingDir: string;
  unusedDir: string;
};

/**
 * The source locale of every `@ttoss/*` package, and therefore what a
 * catalog without a manifest is assumed to be written in.
 */
export const DEFAULT_SOURCE_LOCALE = 'en';

export const DEFAULT_SCOPES = ['@ttoss'];

/**
 * Must equal `@ttoss/config`'s `I18N_ID_INTERPOLATION_PATTERN`, which the
 * build presets inject; a test enforces it. Not imported, because
 * `@ttoss/config` is only a dev dependency of this CLI.
 */
export const ID_INTERPOLATION_PATTERN = '[sha512:contenthash:base64:6]';

/**
 * Must equal the `preserveWhitespace` of `@ttoss/config`'s formatjs presets.
 * The id hashes the message text, so extracting with whitespace collapsed
 * would key every multi-line message differently from the build.
 */
export const PRESERVE_WHITESPACE = true;

export const DEFAULT_DIR = 'i18n';

export const getI18nConfig = ({
  cwd = process.cwd(),
  sourceLocale = DEFAULT_SOURCE_LOCALE,
}: { cwd?: string; sourceLocale?: string } = {}): I18nConfig => {
  const defaultDir = path.join(cwd, DEFAULT_DIR);
  const extractDir = path.join(defaultDir, 'lang');

  return {
    cwd,
    sourceLocale,
    defaultDir,
    extractDir,
    extractFile: path.join(extractDir, `${sourceLocale}.json`),
    manifestFile: path.join(defaultDir, 'manifest.json'),
    compileDir: path.join(defaultDir, 'compiled'),
    missingDir: path.join(defaultDir, 'missing'),
    unusedDir: path.join(defaultDir, 'unused'),
  };
};
