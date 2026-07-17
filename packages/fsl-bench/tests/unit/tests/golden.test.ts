/**
 * Gauntlet calibration — the fairness proof.
 *
 * For every library condition there is a hand-written, correct
 * implementation of every scenario in golden/. Each must pass the FULL
 * gauntlet (compile → render → behavior) with ZERO semantic lint findings.
 * If a golden fails, the harness — not the library — is broken, and any
 * campaign number would be meaningless.
 */
import fs from 'node:fs';
import path from 'node:path';

import { stop as stopEsbuild } from 'esbuild';

import { runGauntlet } from '../../../src/gauntlet/index.ts';
import { findPackageRoot, getLibrary } from '../../../src/libraries.ts';
import { getScenario } from '../../../src/scenarios/index.ts';
import type { LibraryId, ScenarioId } from '../../../src/types.ts';

const goldenDir = path.join(findPackageRoot(), 'golden');

const cases: [LibraryId, ScenarioId][] = [];

for (const libraryId of fs.readdirSync(goldenDir).sort()) {
  for (const file of fs.readdirSync(path.join(goldenDir, libraryId)).sort()) {
    cases.push([
      libraryId as LibraryId,
      file.replace('.tsx', '') as ScenarioId,
    ]);
  }
}

// esbuild keeps a service child process alive; stop it so the jest worker
// exits cleanly.
afterAll(async () => {
  await stopEsbuild();
});

describe('golden fixtures pass the full gauntlet', () => {
  test('the golden matrix is complete (4 libraries x 5 scenarios)', () => {
    expect(cases).toHaveLength(20);
  });

  test.each(cases)('%s / %s', async (libraryId, scenarioId) => {
    const code = fs.readFileSync(
      path.join(goldenDir, libraryId, `${scenarioId}.tsx`),
      'utf8'
    );

    const result = await runGauntlet({
      code,
      scenario: getScenario(scenarioId),
      library: getLibrary(libraryId === 'fsl-ui' ? 'fsl-ui' : libraryId),
    });

    expect(result.errors).toEqual([]);
    expect(result.passed).toBe(true);
    expect(result.lintFindings).toEqual([]);
  });
});
