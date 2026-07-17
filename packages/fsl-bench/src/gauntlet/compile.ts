import path from 'node:path';

import ts from 'typescript';

import { findPackageRoot } from '../libraries.ts';

/**
 * Gauntlet L1 — does the sample type-check?
 *
 * Compiles a single on-disk TSX file with strict settings against the real
 * installed packages (fsl-ui resolves to its `src/` exports, i.e. the same
 * surface a workspace consumer sees). For fsl-ui this is where most semantic
 * errors die mechanically: an illegal `evaluation`, a missing required i18n
 * label or an invented prop is a compile error, not an opinion.
 */
const buildCompilerOptions = (): ts.CompilerOptions => {
  const root = findPackageRoot();
  const typesDir = path.join(root, 'node_modules', '@types');

  return {
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
    // Workspace packages (fsl-ui/fsl-theme) enter the program as SOURCE via
    // their `exports` maps, so the program needs the same ambient types they
    // compile with: Node globals plus @types/react resolvable from every
    // workspace file (pnpm keeps @types under fsl-bench only — map them in).
    typeRoots: [typesDir],
    types: ['node'],
    paths: {
      react: [path.join(typesDir, 'react')],
      'react/jsx-runtime': [path.join(typesDir, 'react', 'jsx-runtime')],
      'react/jsx-dev-runtime': [
        path.join(typesDir, 'react', 'jsx-dev-runtime'),
      ],
    },
    skipLibCheck: true,
    noEmit: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
  };
};

// Chaining oldProgram lets TypeScript reuse the parsed lib + node_modules
// declaration graph across samples — the first compile pays seconds, the
// rest pay milliseconds.
let oldProgram: ts.Program | undefined;

export interface CompileResult {
  ok: boolean;
  errors: string[];
}

export const compileSample = (fileName: string): CompileResult => {
  const program = ts.createProgram(
    [fileName],
    buildCompilerOptions(),
    undefined,
    oldProgram
  );
  oldProgram = program;

  const normalizedSample = path.normalize(fileName);

  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => {
      return diagnostic.category === ts.DiagnosticCategory.Error;
    })
    // The benchmark judges the SAMPLE. Diagnostics inside library sources
    // (workspace packages compile from src with their own tsconfig flags)
    // are not the model's mistakes; errors caused by wrong API usage always
    // surface at the sample's call site.
    .filter((diagnostic) => {
      return (
        !diagnostic.file ||
        path.normalize(diagnostic.file.fileName) === normalizedSample
      );
    });

  const errors = diagnostics.map((diagnostic) => {
    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      '\n'
    );

    if (diagnostic.file && diagnostic.start !== undefined) {
      const { line, character } = ts.getLineAndCharacterOfPosition(
        diagnostic.file,
        diagnostic.start
      );
      return `${diagnostic.file.fileName}(${line + 1},${character + 1}): TS${
        diagnostic.code
      }: ${message}`;
    }

    return `TS${diagnostic.code}: ${message}`;
  });

  return { ok: errors.length === 0, errors };
};
