import fs from 'node:fs';
import path from 'node:path';

import {
  DEFAULT_DIR,
  DEFAULT_SOURCE_LOCALE,
  type TranslationData,
} from './config';

type PackageJson = {
  name?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

/**
 * One package's shipped catalogs: its source file plus every translation it
 * ships, keyed by locale.
 */
export type DependencyCatalog = {
  module: string;
  sourceLocale: string;
  locales: Record<string, TranslationData>;
};

/**
 * Packages that ship messages only for their own tests, or none at all.
 */
const EXCLUDED_DEPENDENCIES = ['@ttoss/react-i18n', '@ttoss/i18n-cli'];

const readJson = <T>(file: string, what: string): T => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`ttoss-i18n: cannot read ${what} at ${file}`, {
      cause: error,
    });
  }
};

/**
 * Walk up from `fromDir` the way Node resolves `node_modules`. Unlike
 * `require.resolve('<name>/package.json')` this works for packages whose
 * `exports` does not expose `package.json`, and from a pnpm symlink's real
 * path it finds the package's own dependencies.
 */
export const findPackageDir = (name: string, fromDir: string) => {
  let dir = fromDir;

  for (;;) {
    const candidate = path.join(dir, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) {
      return fs.realpathSync(candidate);
    }

    const parent = path.dirname(dir);
    if (parent === dir) {
      return undefined;
    }
    dir = parent;
  }
};

const getScopedDependencies = (packageJson: PackageJson, scopes: string[]) => {
  return [
    ...new Set(
      Object.keys({
        ...packageJson.dependencies,
        ...packageJson.peerDependencies,
      })
    ),
  ].filter((dependency) => {
    return (
      !EXCLUDED_DEPENDENCIES.includes(dependency) &&
      dependency !== packageJson.name &&
      scopes.some((scope) => {
        return dependency.startsWith(`${scope}/`);
      })
    );
  });
};

/**
 * `undefined` when the package ships no catalog, which is most packages.
 * A catalog that exists but cannot be parsed throws: silently dropping it
 * would ship an app with a whole package untranslated and nothing reporting
 * it.
 */
export const readDependencyCatalog = ({
  module,
  packageDir,
}: {
  module: string;
  packageDir: string;
}): DependencyCatalog | undefined => {
  const langDir = path.join(packageDir, DEFAULT_DIR, 'lang');

  if (!fs.existsSync(langDir)) {
    return undefined;
  }

  const manifestFile = path.join(packageDir, DEFAULT_DIR, 'manifest.json');
  const sourceLocale = fs.existsSync(manifestFile)
    ? (readJson<{ sourceLocale?: string }>(manifestFile, `${module} manifest`)
        .sourceLocale ?? DEFAULT_SOURCE_LOCALE)
    : DEFAULT_SOURCE_LOCALE;

  const locales: Record<string, TranslationData> = {};

  for (const file of fs.readdirSync(langDir).sort()) {
    if (!file.endsWith('.json')) {
      continue;
    }
    const data = readJson<TranslationData>(
      path.join(langDir, file),
      `${module} catalog`
    );
    const locale = file.slice(0, -'.json'.length);
    locales[locale] = Object.fromEntries(
      Object.entries(data).map(([id, entry]) => {
        return [id, { module, ...entry }];
      })
    );
  }

  if (!locales[sourceLocale]) {
    return undefined;
  }

  return { module, sourceLocale, locales };
};

/**
 * Every in-scope package this one depends on, direct and transitive, that
 * ships a catalog — nearest first, so a direct dependency's translation wins
 * over one found further down the tree.
 */
export const getDependencyCatalogs = ({
  cwd,
  scopes,
}: {
  cwd: string;
  scopes: string[];
}): DependencyCatalog[] => {
  const root = readJson<PackageJson>(
    path.join(cwd, 'package.json'),
    'package.json'
  );

  const catalogs: DependencyCatalog[] = [];
  const visited = new Set<string>(root.name ? [root.name] : []);
  const queue = getScopedDependencies(root, scopes).map((name) => {
    return { name, fromDir: cwd };
  });

  while (queue.length > 0) {
    const { name, fromDir } = queue.shift()!;

    if (visited.has(name)) {
      continue;
    }
    visited.add(name);

    const packageDir = findPackageDir(name, fromDir);

    if (!packageDir) {
      continue;
    }

    const catalog = readDependencyCatalog({ module: name, packageDir });

    if (catalog) {
      catalogs.push(catalog);
    }

    const packageJson = readJson<PackageJson>(
      path.join(packageDir, 'package.json'),
      `${name} package.json`
    );

    for (const dependency of getScopedDependencies(packageJson, scopes)) {
      queue.push({ name: dependency, fromDir: packageDir });
    }
  }

  return catalogs;
};

/**
 * What the dependencies provide for `locale`: a shipped translation, or the
 * source text when the dependency is authored in that locale. An id with
 * neither is left out, so it is reported missing for `locale`.
 */
export const getDependencyMessagesForLocale = ({
  catalogs,
  locale,
}: {
  catalogs: DependencyCatalog[];
  locale: string;
}): TranslationData => {
  const messages: TranslationData = {};

  for (const catalog of catalogs) {
    const translations = catalog.locales[locale] ?? {};
    const source = catalog.locales[catalog.sourceLocale];

    for (const id of Object.keys(source)) {
      if (messages[id]) {
        continue;
      }
      if (translations[id]) {
        messages[id] = translations[id];
      } else if (catalog.sourceLocale === locale) {
        messages[id] = source[id];
      }
    }
  }

  return messages;
};

/**
 * Every id the dependencies declare, in `locale` where they ship it and in
 * their own source language otherwise — the text a reader of `locale` sees
 * when the app provides nothing better.
 */
export const getDependencySourceMessages = ({
  catalogs,
  locale,
}: {
  catalogs: DependencyCatalog[];
  locale: string;
}): TranslationData => {
  const inLocale = getDependencyMessagesForLocale({ catalogs, locale });
  const messages: TranslationData = {};

  for (const catalog of catalogs) {
    const source = catalog.locales[catalog.sourceLocale];

    for (const id of Object.keys(source)) {
      messages[id] ??= inLocale[id] ?? source[id];
    }
  }

  return messages;
};
