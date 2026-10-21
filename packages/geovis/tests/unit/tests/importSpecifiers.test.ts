import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import * as path from 'node:path';

/*
 * geovis ships ESM only, and consumers that load it with Node's own resolver
 * (Next.js `serverExternalPackages`, plain `node`) resolve every bare import
 * strictly. A deep import into a package that declares no `exports` map
 * (`ajv/dist/2020`) needs its file extension there: the bundler keeps the
 * specifier as written, so a missing one crashes the consumer at import time.
 */

const PACKAGE_ROOT = path.resolve(__dirname, '../../..');
const SRC = path.join(PACKAGE_ROOT, 'src');
const requireFromPackage = createRequire(
  path.join(PACKAGE_ROOT, 'package.json')
);

const EXPLICIT_EXTENSION = /\.(c|m)?js$|\.json$|\.css$/;

const sourceFiles = (dir: string): string[] => {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(full);
    }
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
};

/** Bare specifiers of the static and dynamic imports in a source file. */
const bareSpecifiers = (file: string): string[] => {
  const text = fs.readFileSync(file, 'utf8');
  const matches = text.matchAll(
    /(?:from\s+|import\s*\(?\s*)['"]([^'"./][^'"]*)['"]/g
  );
  return [...matches].map((match) => {
    return match[1];
  });
};

/** Splits `@scope/name/sub/path` or `name/sub/path` into package and subpath. */
const splitSpecifier = (
  specifier: string
): { packageName: string; subpath: string } => {
  const parts = specifier.split('/');
  const nameLength = specifier.startsWith('@') ? 2 : 1;
  return {
    packageName: parts.slice(0, nameLength).join('/'),
    subpath: parts.slice(nameLength).join('/'),
  };
};

/** Whether the package declares an `exports` map (its own subpath rules). */
const declaresExports = (packageName: string): boolean => {
  try {
    const manifest = requireFromPackage(`${packageName}/package.json`) as {
      exports?: unknown;
    };
    return manifest.exports !== undefined;
  } catch {
    // An `exports` map that hides `package.json` is still an `exports` map.
    return true;
  }
};

test('deep imports into packages without an exports map carry their extension', () => {
  const offenders = sourceFiles(SRC).flatMap((file) => {
    return bareSpecifiers(file)
      .filter((specifier) => {
        const { packageName, subpath } = splitSpecifier(specifier);
        return (
          subpath !== '' &&
          !EXPLICIT_EXTENSION.test(subpath) &&
          !declaresExports(packageName)
        );
      })
      .map((specifier) => {
        return `${path.relative(PACKAGE_ROOT, file)}: '${specifier}'`;
      });
  });

  expect(offenders).toEqual([]);
});
