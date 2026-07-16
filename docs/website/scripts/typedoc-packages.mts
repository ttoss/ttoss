import fs from 'node:fs';
import path from 'node:path';

/**
 * Shared configuration for generating the per-package TypeDoc API docs.
 *
 * This mirrors the package discovery and per-package options that used to live
 * inline in `docusaurus.config.ts` as `docusaurus-plugin-typedoc` instances.
 * TypeDoc is now run in a separate step (see `generate-api-docs.mts`) so that
 * its memory usage is not coupled to the Docusaurus build process.
 */

/**
 * Root of the `@docs/website` package. All relative paths below are resolved
 * from here so the scripts behave the same regardless of the current working
 * directory.
 */
export const websiteDir = path.resolve(import.meta.dirname, '..');

const packagesDir = path.resolve(websiteDir, '../../packages');

/**
 * Packages excluded from API doc generation (documented manually or without a
 * public API surface worth generating).
 */
const excludedPackages = ['eslint-config'];

/**
 * Returns the list of package directory names that should have API docs
 * generated — every directory under `packages/` that has a `README.md`, minus
 * the excluded packages.
 */
export const getPackages = (): string[] => {
  return fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((dirent) => {
      return (
        dirent.isDirectory() &&
        fs.existsSync(path.join(packagesDir, dirent.name, 'README.md'))
      );
    })
    .map((dirent) => {
      return dirent.name;
    })
    .filter((pkg) => {
      return !excludedPackages.includes(pkg);
    });
};

/**
 * Derives the TypeDoc entry points for a package from its `exports` map,
 * falling back to `src/index.ts` when there is no usable `exports` field.
 */
const getEntryPoints = (pkg: string): string[] => {
  const fallback = [`../../packages/${pkg}/src/index.ts`];

  const packageJsonObj = JSON.parse(
    fs.readFileSync(path.join(packagesDir, pkg, 'package.json'), 'utf-8')
  );

  if (!packageJsonObj.exports) {
    return fallback;
  }

  const entryPoints = (Object.values(packageJsonObj.exports) as unknown[])
    .filter((filepath): filepath is string => {
      return typeof filepath === 'string' && filepath.endsWith('.ts');
    })
    .map((filepath) => {
      return path.join(`../../packages/${pkg}`, filepath);
    });

  if (entryPoints.length === 0) {
    return fallback;
  }

  return entryPoints;
};

/**
 * Builds the TypeDoc options for a single package. These are the same options
 * previously passed to each `docusaurus-plugin-typedoc` instance, plus the
 * `plugin`, `docsPath` and `numberPrefixParser` values that the plugin injected
 * internally (see `docusaurus-plugin-typedoc`'s `getPluginOptions`), so the
 * generated output is equivalent to the previous in-process generation.
 */
export const getTypedocOptions = (pkg: string) => {
  return {
    entryPoints: getEntryPoints(pkg),
    tsconfig: `../../packages/${pkg}/tsconfig.json`,
    out: `./docs/modules/packages/${pkg}`,
    /**
     * Consumed by `typedoc-docusaurus-theme` to place the generated docs
     * relative to the Docusaurus `docs` directory. Matches the value the plugin
     * derived from the classic preset's default `docs` path.
     */
    docsPath: path.join(websiteDir, 'docs'),
    numberPrefixParser: true,
    sidebar: {
      autoConfiguration: true,
    },
    excludeExternals: true,
    excludeNotDocumented: true,
    excludeNotDocumentedKinds: ['Namespace'],
    skipErrorChecking: true,
    parametersFormat: 'table',
    plugin: ['typedoc-plugin-markdown', 'typedoc-docusaurus-theme'],
  };
};
