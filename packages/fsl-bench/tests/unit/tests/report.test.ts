import { aggregate, renderReport } from '../../../src/report.ts';
import type {
  GauntletResult,
  LibraryId,
  SampleRecord,
  ScenarioId,
} from '../../../src/types.ts';

const pass: GauntletResult = { passed: true, errors: [], lintFindings: [] };

const fail: GauntletResult = {
  passed: false,
  failedLevel: 'behavior',
  errors: ['nope'],
  lintFindings: [{ rule: 'no-raw-colors', message: 'x', line: 1 }],
};

const sample = (overrides: Partial<SampleRecord>): SampleRecord => {
  return {
    runId: 'run-test',
    scenario: 'dialog' as ScenarioId,
    library: 'fsl-ui' as LibraryId,
    model: 'model-x',
    provider: 'anthropic',
    rep: 1,
    roundsToGreen: 0,
    firstPass: pass,
    finalPass: pass,
    completions: [],
    codes: [],
    contextSha256: 'ctx',
    promptSha256: 'prm',
    timestamp: '2026-07-16T00:00:00.000Z',
    ...overrides,
  };
};

describe('aggregate', () => {
  test('computes first-pass rate, lint mean, repair mean and never-green', () => {
    const samples = [
      sample({ rep: 1 }),
      sample({ rep: 2, roundsToGreen: 1, firstPass: fail }),
      sample({ rep: 3, roundsToGreen: null, firstPass: fail, finalPass: fail }),
    ];

    const [cell] = aggregate(samples);

    expect(cell.samples).toBe(3);
    expect(cell.firstPassSuccesses).toBe(1);
    expect(cell.meanLintFindings).toBeCloseTo(2 / 3);
    // Green samples: rounds 0 and 1 → mean 0.5.
    expect(cell.meanRoundsToGreen).toBeCloseTo(0.5);
    expect(cell.neverGreen).toBe(1);
    expect(cell.perScenario.dialog).toEqual({ passed: 1, total: 3 });
  });

  test('splits cells by library and model', () => {
    const samples = [
      sample({}),
      sample({ library: 'mui' as LibraryId }),
      sample({ model: 'model-y' }),
    ];

    expect(aggregate(samples)).toHaveLength(3);
  });
});

describe('renderReport', () => {
  const samples = [
    sample({}),
    sample({
      library: 'fsl-ui-bare' as LibraryId,
      roundsToGreen: 1,
      firstPass: fail,
    }),
    sample({ library: 'react-aria' as LibraryId }),
    sample({ library: 'mui' as LibraryId }),
  ];

  const report = renderReport({ runId: 'run-test', samples });

  test('renders the headless cohort and the control separately', () => {
    const cohortSection = report.split('### Control')[0];
    expect(cohortSection).toContain('@ttoss/fsl-ui (+llms.txt)');
    expect(cohortSection).toContain('React Aria Components');
    expect(cohortSection).not.toContain('MUI (control)');
    expect(report).toContain('### Control — opinionated library');
    expect(report).toContain('MUI (control)');
  });

  test('renders the llms.txt A/B delta', () => {
    // with = 1/1, bare = 0/1 → +100 pp.
    expect(report).toContain('**100 pp**');
  });

  test('renders the per-scenario breakdown', () => {
    expect(report).toContain('### Per-scenario first-pass');
    expect(report).toContain('| dialog |');
  });
});
