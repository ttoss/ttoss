import { getScenario } from '../scenarios/index.ts';
import type { ScenarioId } from '../types.ts';
import { renderAndAssert } from './render.ts';
import { RESULT_MARKER } from './renderProtocol.ts';

/**
 * Child-process entry for gauntlet L2/L3.
 *
 * The render + behavior stage always runs in a dedicated Node process
 * (spawned by gauntlet/index.ts) for two reasons:
 * - real native module resolution — test runners like jest replace
 *   `createRequire` with a registry-bound copy that cannot load jsdom's ESM
 *   dependency graph;
 * - hard per-sample isolation — a fresh jsdom/React world per sample, so no
 *   DOM, portal, or scroll-lock state can leak between samples.
 *
 * Usage: node --experimental-strip-types renderChild.ts <bundlePath> <scenarioId>
 */
const [, , bundlePath, scenarioId] = process.argv;

const failure = await renderAndAssert({
  bundlePath,
  scenario: getScenario(scenarioId as ScenarioId),
});

// eslint-disable-next-line no-console -- stdout IS the wire protocol here
console.log(`${RESULT_MARKER}${JSON.stringify(failure)}`);
process.exit(0);
