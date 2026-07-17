/* eslint-disable no-console -- CLI: the report is printed to stdout */
import fs from 'node:fs';
import path from 'node:path';

import { findPackageRoot } from './libraries.ts';
import { renderReport } from './report.ts';
import type { SampleRecord } from './types.ts';

/**
 * Re-renders the report of a past run from its persisted samples:
 *
 *   pnpm run bench:report -- <runId>
 */
const runId = process.argv[2];

if (!runId) {
  throw new Error('Usage: pnpm run bench:report -- <runId>');
}

const resultsDir = path.join(findPackageRoot(), 'results', runId);
const samples: SampleRecord[] = fs
  .readFileSync(path.join(resultsDir, 'samples.jsonl'), 'utf8')
  .trim()
  .split('\n')
  .map((line) => {
    return JSON.parse(line) as SampleRecord;
  });

const report = renderReport({ runId, samples });
fs.writeFileSync(path.join(resultsDir, 'report.md'), report);
console.log(report);
