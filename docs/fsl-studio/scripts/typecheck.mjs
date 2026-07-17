/**
 * Type-checks the Studio's own sources.
 *
 * The Studio consumes @ttoss/fsl-ui and @ttoss/fsl-theme via their src/
 * exports (workspace dev model), so the TypeScript program inevitably pulls
 * those sources in — but they are calibrated against their own tsconfig and
 * environment, and judging them here is both out of scope (PRD §2: the
 * packages are read-only for this app) and environmentally fragile.
 *
 * Precedent: packages/fsl-bench/src/gauntlet/compile.ts applies exactly this
 * policy for benchmark samples — diagnostics inside workspace library
 * sources are not the consumer's mistakes; wrong API usage always surfaces
 * at the consumer's call site.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(appRoot, 'tsconfig.json');

const parsed = ts.getParsedCommandLineOfConfigFile(
  configPath,
  {},
  {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
      throw new Error(
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      );
    },
  }
);

if (!parsed) {
  throw new Error(`Could not parse ${configPath}`);
}

const program = ts.createProgram(parsed.fileNames, parsed.options);

const srcDir = path.join(appRoot, 'src') + path.sep;

const errors = ts.getPreEmitDiagnostics(program).filter((diagnostic) => {
  return diagnostic.category === ts.DiagnosticCategory.Error;
});

const localErrors = errors.filter((diagnostic) => {
  return (
    !diagnostic.file ||
    path.normalize(diagnostic.file.fileName).startsWith(srcDir)
  );
});

const externalCount = errors.length - localErrors.length;

if (externalCount > 0) {
  console.log(
    `[typecheck] ignored ${externalCount} diagnostic(s) inside workspace ` +
      'dependency sources (they compile under their own tsconfig; see ' +
      'packages/fsl-bench/src/gauntlet/compile.ts for the precedent).'
  );
}

if (localErrors.length > 0) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(localErrors, {
      getCanonicalFileName: (fileName) => {
        return fileName;
      },
      getCurrentDirectory: () => {
        return appRoot;
      },
      getNewLine: () => {
        return ts.sys.newLine;
      },
    })
  );
  console.error(`[typecheck] ${localErrors.length} error(s) in app sources.`);
  process.exit(1);
}

console.log(
  `[typecheck] app sources OK (${parsed.fileNames.length} entry files).`
);
