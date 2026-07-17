import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

import { findPackageRoot } from '../libraries.ts';
import type { GauntletResult, LibraryCondition, Scenario } from '../types.ts';
import { bundleSample } from './bundle.ts';
import { compileSample } from './compile.ts';
import { lintSample } from './lint.ts';
import { type ChildRenderFailure, RESULT_MARKER } from './renderProtocol.ts';

/**
 * Runs one sample through the objective gauntlet:
 *
 *   L4 lint      (always computed — the semantic-error-rate metric)
 *   L1 compile   (tsc strict against the real installed packages)
 *   L2 render    (bundle + mount in jsdom)
 *   L3 behavior  (the scenario's user-observable assertions)
 *
 * first-pass success = L1–L3 green with zero repairs. Lint findings do not
 * fail the gauntlet; they are reported as a separate rate.
 */
let sampleCounter = 0;

const execFileAsync = promisify(execFile);

const CHILD_TIMEOUT_MS = 60000;

/**
 * L2/L3 always run in a dedicated Node process (see renderChild.ts): real
 * native module resolution regardless of the host runtime, and hard
 * per-sample isolation — a fresh jsdom/React world every time.
 */
const renderInChild = async ({
  bundlePath,
  scenarioId,
}: {
  bundlePath: string;
  scenarioId: string;
}): Promise<ChildRenderFailure | null> => {
  const childEntry = path.join(
    findPackageRoot(),
    'src',
    'gauntlet',
    'renderChild.ts'
  );

  let stdout = '';

  try {
    const result = await execFileAsync(
      process.execPath,
      ['--experimental-strip-types', childEntry, bundlePath, scenarioId],
      {
        cwd: findPackageRoot(),
        timeout: CHILD_TIMEOUT_MS,
        maxBuffer: 16 * 1024 * 1024,
      }
    );
    stdout = result.stdout;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const failed = error as any;

    if (failed?.killed) {
      return {
        level: 'behavior',
        error: `the sample did not settle within ${CHILD_TIMEOUT_MS / 1000}s (likely an infinite render or update loop)`,
      };
    }

    return {
      level: 'render',
      error: `the render process crashed: ${String(
        failed?.stderr ?? failed
      ).slice(0, 2000)}`,
    };
  }

  const resultLine = stdout.split('\n').find((line) => {
    return line.startsWith(RESULT_MARKER);
  });

  if (!resultLine) {
    return {
      level: 'render',
      error: `the render process produced no result: ${stdout.slice(0, 2000)}`,
    };
  }

  return JSON.parse(
    resultLine.slice(RESULT_MARKER.length)
  ) as ChildRenderFailure | null;
};

export const runGauntlet = async ({
  code,
  scenario,
  library,
  keepArtifacts = false,
}: {
  code: string;
  scenario: Scenario;
  library: LibraryCondition;
  keepArtifacts?: boolean;
}): Promise<GauntletResult> => {
  const lintFindings = lintSample({ code, profile: library.lintProfile });

  const root = findPackageRoot();
  sampleCounter += 1;
  const workDir = path.join(
    root,
    '.bench-tmp',
    `${scenario.id}-${library.id}-${sampleCounter}-${process.pid}`
  );
  fs.mkdirSync(workDir, { recursive: true });

  const entry = path.join(workDir, 'sample.tsx');
  const outfile = path.join(workDir, 'sample.cjs');
  fs.writeFileSync(entry, code);

  try {
    const compiled = compileSample(entry);

    if (!compiled.ok) {
      return {
        passed: false,
        failedLevel: 'compile',
        errors: compiled.errors,
        lintFindings,
      };
    }

    const bundled = await bundleSample({ entry, outfile });

    if (!bundled.ok) {
      return {
        passed: false,
        failedLevel: 'render',
        errors: bundled.errors,
        lintFindings,
      };
    }

    const failure = await renderInChild({
      bundlePath: outfile,
      scenarioId: scenario.id,
    });

    if (failure) {
      return {
        passed: false,
        failedLevel: failure.level,
        errors: [failure.error],
        lintFindings,
      };
    }

    return { passed: true, errors: [], lintFindings };
  } finally {
    if (!keepArtifacts) {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }
};
