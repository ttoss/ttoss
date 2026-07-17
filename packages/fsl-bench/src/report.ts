import { LIBRARIES } from './libraries.ts';
import { SCENARIOS } from './scenarios/index.ts';
import { formatInterval, wilson } from './stats.ts';
import type { LibraryId, SampleRecord } from './types.ts';

/**
 * Pure aggregation + markdown rendering of a campaign's samples. All IO
 * (reading samples.jsonl, writing report.md) lives in the runner/CLI.
 */
export interface CellAggregate {
  library: LibraryId;
  provider: string;
  model: string;
  samples: number;
  firstPassSuccesses: number;
  /** Mean L4 lint findings on the FIRST completion of each sample. */
  meanLintFindings: number;
  /** Mean repair rounds over samples that eventually went green. */
  meanRoundsToGreen: number | null;
  /** Samples that never passed within the repair budget. */
  neverGreen: number;
  perScenario: Record<string, { passed: number; total: number }>;
}

interface CellAccumulator extends CellAggregate {
  lintTotal: number;
  greenRounds: number[];
}

const cellKey = (sample: SampleRecord): string => {
  return `${sample.library}::${sample.provider}::${sample.model}`;
};

const emptyCell = (sample: SampleRecord): CellAccumulator => {
  return {
    library: sample.library,
    provider: sample.provider,
    model: sample.model,
    samples: 0,
    firstPassSuccesses: 0,
    meanLintFindings: 0,
    meanRoundsToGreen: null,
    neverGreen: 0,
    perScenario: {},
    lintTotal: 0,
    greenRounds: [],
  };
};

const accumulate = (cell: CellAccumulator, sample: SampleRecord): void => {
  cell.samples += 1;
  cell.lintTotal += sample.firstPass.lintFindings.length;

  const firstPassGreen = sample.roundsToGreen === 0;

  if (firstPassGreen) {
    cell.firstPassSuccesses += 1;
  }

  if (sample.roundsToGreen === null) {
    cell.neverGreen += 1;
  } else {
    cell.greenRounds.push(sample.roundsToGreen);
  }

  const scenarioBucket = (cell.perScenario[sample.scenario] ??= {
    passed: 0,
    total: 0,
  });
  scenarioBucket.total += 1;

  if (firstPassGreen) {
    scenarioBucket.passed += 1;
  }
};

const mean = (values: number[]): number | null => {
  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => {
    return sum + value;
  }, 0);

  return total / values.length;
};

export const aggregate = (samples: SampleRecord[]): CellAggregate[] => {
  const cells = new Map<string, CellAccumulator>();

  for (const sample of samples) {
    const key = cellKey(sample);
    const cell = cells.get(key) ?? emptyCell(sample);
    cells.set(key, cell);
    accumulate(cell, sample);
  }

  return [...cells.values()].map((cell) => {
    const { lintTotal, greenRounds, ...aggregateCell } = cell;

    return {
      ...aggregateCell,
      meanLintFindings: lintTotal / cell.samples,
      meanRoundsToGreen: mean(greenRounds),
    };
  });
};

const libraryOf = (library: LibraryId) => {
  return LIBRARIES.find((candidate) => {
    return candidate.id === library;
  });
};

const displayNameOf = (library: LibraryId): string => {
  return libraryOf(library)?.displayName ?? library;
};

const renderCellRow = (cell: CellAggregate): string => {
  const interval = wilson({
    successes: cell.firstPassSuccesses,
    total: cell.samples,
  });

  const rounds =
    cell.meanRoundsToGreen === null ? '—' : cell.meanRoundsToGreen.toFixed(2);

  return `| ${displayNameOf(cell.library)} | ${formatInterval(interval)} | ${cell.meanLintFindings.toFixed(2)} | ${rounds} | ${cell.neverGreen}/${cell.samples} |`;
};

const TABLE_HEADER = [
  '| Library | First-pass success (Wilson 95%) | Semantic errors / sample | Rounds-to-green (mean) | Never green |',
  '| --- | --- | --- | --- | --- |',
].join('\n');

const renderCohortTables = (group: CellAggregate[]): string[] => {
  const cohortRows = group.filter((cell) => {
    return libraryOf(cell.library)?.cohort !== 'control';
  });
  const controlRows = group.filter((cell) => {
    return libraryOf(cell.library)?.cohort === 'control';
  });

  const lines = [
    '### Headless cohort (candidate + baselines)',
    '',
    TABLE_HEADER,
    ...cohortRows.map(renderCellRow),
  ];

  if (controlRows.length > 0) {
    lines.push(
      '',
      '### Control — opinionated library (separate cohort)',
      '',
      TABLE_HEADER,
      ...controlRows.map(renderCellRow)
    );
  }

  return lines;
};

const renderAbDelta = (group: CellAggregate[]): string[] => {
  const withContext = group.find((cell) => {
    return cell.library === 'fsl-ui';
  });
  const bare = group.find((cell) => {
    return cell.library === 'fsl-ui-bare';
  });

  if (!withContext || !bare) {
    return [];
  }

  const delta =
    withContext.firstPassSuccesses / withContext.samples -
    bare.firstPassSuccesses / bare.samples;

  return [
    '',
    '### A/B — contribution of llms.txt (grammar vs model priors)',
    '',
    `First-pass delta (with − without llms.txt): **${(delta * 100).toFixed(0)} pp**.`,
  ];
};

const renderScenarioTable = (group: CellAggregate[]): string[] => {
  const lines = [
    '',
    '### Per-scenario first-pass (passed/total)',
    '',
    `| Library | ${SCENARIOS.map((scenario) => {
      return scenario.id;
    }).join(' | ')} |`,
    `| --- | ${SCENARIOS.map(() => {
      return '--- |';
    }).join(' ')}`,
  ];

  for (const cell of group) {
    const rowCells = SCENARIOS.map((scenario) => {
      const bucket = cell.perScenario[scenario.id];
      return bucket ? `${bucket.passed}/${bucket.total}` : '—';
    });
    lines.push(`| ${displayNameOf(cell.library)} | ${rowCells.join(' | ')} |`);
  }

  return lines;
};

export const renderReport = ({
  runId,
  samples,
}: {
  runId: string;
  samples: SampleRecord[];
}): string => {
  const cells = aggregate(samples);

  const modelGroups = new Map<string, CellAggregate[]>();

  for (const cell of cells) {
    const key = `${cell.provider}/${cell.model}`;
    const group = modelGroups.get(key) ?? [];
    group.push(cell);
    modelGroups.set(key, group);
  }

  const lines: string[] = [
    `# fsl-bench — AI-executability report`,
    '',
    `Run \`${runId}\` — ${samples.length} samples. First-pass success = compile + render + behavior green with zero repairs. Semantic errors = mechanical L4 lint findings on the first completion. Rounds-to-green = repair-loop rounds until green (proxy for human corrections).`,
    '',
  ];

  for (const [modelKey, group] of modelGroups) {
    lines.push(
      `## Model: ${modelKey}`,
      '',
      ...renderCohortTables(group),
      ...renderAbDelta(group),
      ...renderScenarioTable(group),
      ''
    );
  }

  return lines.join('\n');
};
