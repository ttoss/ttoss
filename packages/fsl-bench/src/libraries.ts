import fs from 'node:fs';
import path from 'node:path';

import type { LibraryCondition, LibraryId } from './types.ts';

/**
 * The benchmark conditions.
 *
 * Cohort design (recorded in fsl-ui ROADMAP §D1):
 * - candidate: fsl-ui with its shipped llms.txt (the artifact under test)
 *   plus the `fsl-ui-bare` A/B condition (same library, minimal context) —
 *   the pair isolates the contribution of the grammar from model priors.
 * - baseline: the headless cohort (React Aria Components, Radix Primitives),
 *   each with a docs excerpt of comparable token budget.
 * - control: MUI — massively represented in training data and fully styled;
 *   reported in a separate column per the BENCHMARK_EVAL cohort rule.
 */
export const LIBRARIES: LibraryCondition[] = [
  {
    id: 'fsl-ui',
    displayName: '@ttoss/fsl-ui (+llms.txt)',
    cohort: 'candidate',
    packages: ['@ttoss/fsl-ui', '@ttoss/fsl-theme'],
    contextFile: '../fsl-ui/llms.txt',
    lintProfile: 'fsl',
  },
  {
    id: 'fsl-ui-bare',
    displayName: '@ttoss/fsl-ui (no llms.txt)',
    cohort: 'candidate',
    packages: ['@ttoss/fsl-ui', '@ttoss/fsl-theme'],
    contextFile: 'contexts/fsl-ui-bare.md',
    lintProfile: 'fsl',
  },
  {
    id: 'react-aria',
    displayName: 'React Aria Components',
    cohort: 'baseline',
    packages: ['react-aria-components'],
    contextFile: 'contexts/react-aria.md',
    lintProfile: 'generic',
  },
  {
    id: 'radix',
    displayName: 'Radix Primitives',
    cohort: 'baseline',
    packages: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-switch',
      '@radix-ui/react-label',
    ],
    contextFile: 'contexts/radix.md',
    lintProfile: 'generic',
  },
  {
    id: 'mui',
    displayName: 'MUI (control)',
    cohort: 'control',
    packages: ['@mui/material'],
    contextFile: 'contexts/mui.md',
    lintProfile: 'generic',
  },
];

export const getLibrary = (id: LibraryId): LibraryCondition => {
  const library = LIBRARIES.find((candidate) => {
    return candidate.id === id;
  });

  if (!library) {
    throw new Error(`Unknown library condition: ${id}`);
  }

  return library;
};

/**
 * Locates the fsl-bench package root by walking up from `cwd`, so the
 * harness works whether invoked from the package dir (pnpm/turbo) or from a
 * test runner with a different working directory.
 */
export const findPackageRoot = (startDir: string = process.cwd()): string => {
  let current = startDir;

  for (;;) {
    const candidate = path.join(current, 'package.json');

    if (fs.existsSync(candidate)) {
      const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8')) as {
        name?: string;
      };

      if (parsed.name === '@ttoss/fsl-bench') {
        return current;
      }
    }

    const parent = path.dirname(current);

    if (parent === current) {
      throw new Error(
        'Could not locate the @ttoss/fsl-bench package root from ' + startDir
      );
    }

    // Walking into the monorepo root: check the sibling directly.
    const sibling = path.join(current, 'packages', 'fsl-bench', 'package.json');

    if (fs.existsSync(sibling)) {
      return path.dirname(sibling);
    }

    current = parent;
  }
};

export const loadContext = (library: LibraryCondition): string => {
  const root = findPackageRoot();
  const contextPath = path.resolve(root, library.contextFile);
  return fs.readFileSync(contextPath, 'utf8');
};
