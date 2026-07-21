/* eslint-disable no-console -- CLI: progress output is the interface */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { extractCode } from './extract.ts';
import { runGauntlet } from './gauntlet/index.ts';
import {
  findPackageRoot,
  getLibrary,
  LIBRARIES,
  loadContext,
} from './libraries.ts';
import type { ChatMessage, Provider } from './providers/index.ts';
import { createProvider } from './providers/index.ts';
import { renderReport } from './report.ts';
import { getScenario, SCENARIOS } from './scenarios/index.ts';
import type {
  GauntletResult,
  LibraryCondition,
  LibraryId,
  SampleRecord,
  Scenario,
  ScenarioId,
} from './types.ts';

/**
 * Campaign runner — the D1 execution harness.
 *
 *   pnpm run bench                       # full matrix, 5 reps
 *   pnpm run bench -- --reps 3 --providers anthropic \
 *     --libraries fsl-ui,react-aria --scenarios dialog,menu
 *   pnpm run bench -- --providers vertex:gemini-3.5-flash,vertex:gemini-2.5-pro
 *   pnpm run bench -- --dry              # print the matrix, no API calls
 *
 * Providers (`<id>` or `<id>:<model>`): anthropic, gemini, vertex, bedrock
 * — vertex serves both Claude and Gemini (the model id picks the dialect);
 * auth and default models in the provider registry (src/providers) and
 * README. Every completion, code extraction and gauntlet verdict is
 * appended to results/<runId>/samples.jsonl (the audit trail); the report
 * is rendered at the end.
 */
const MAX_REPAIR_ROUNDS = 2;

const sha256 = (value: string): string => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

const buildSystemPrompt = ({
  library,
  context,
}: {
  library: LibraryCondition;
  context: string;
}): string => {
  return [
    'You are an expert React + TypeScript engineer. Build the requested UI',
    `using ONLY the library "${library.displayName}" (packages: ${library.packages.join(', ')}) plus react itself.`,
    '',
    '# Reference documentation',
    '',
    context,
    '',
    '# Output rules',
    '',
    '- Reply with exactly one complete, self-contained .tsx file inside a single ```tsx code block. No prose outside the block.',
    '- The file must `export default` a React component named App that renders the requested UI.',
    `- Only import from: ${library.packages.join(', ')}, react. No other UI libraries, no CSS files.`,
    '- The code must pass TypeScript strict mode.',
  ].join('\n');
};

const buildRepairMessage = (result: GauntletResult): string => {
  return [
    `Your code failed at the ${result.failedLevel} stage with:`,
    '',
    result.errors.join('\n').slice(0, 4000),
    '',
    'Return the corrected COMPLETE file in a single ```tsx code block.',
  ].join('\n');
};

const runSample = async ({
  runId,
  scenario,
  library,
  provider,
  rep,
  context,
  systemPrompt,
}: {
  runId: string;
  scenario: Scenario;
  library: LibraryCondition;
  provider: Provider;
  rep: number;
  context: string;
  systemPrompt: string;
}): Promise<SampleRecord> => {
  const messages: ChatMessage[] = [{ role: 'user', content: scenario.prompt }];
  const completions: string[] = [];
  const codes: string[] = [];

  let firstPass: GauntletResult | null = null;
  let finalPass: GauntletResult | null = null;
  let roundsToGreen: number | null = null;

  for (let round = 0; round <= MAX_REPAIR_ROUNDS; round += 1) {
    const completion = await provider.generate({
      system: systemPrompt,
      messages,
    });
    completions.push(completion);

    const code = extractCode(completion);
    codes.push(code ?? '');

    const result: GauntletResult = code
      ? await runGauntlet({ code, scenario, library })
      : {
          passed: false,
          failedLevel: 'compile',
          errors: ['no code block found in the reply'],
          lintFindings: [],
        };

    firstPass ??= result;
    finalPass = result;

    if (result.passed) {
      roundsToGreen = round;
      break;
    }

    messages.push(
      { role: 'assistant', content: completion },
      { role: 'user', content: buildRepairMessage(result) }
    );
  }

  return {
    runId,
    scenario: scenario.id,
    library: library.id,
    model: provider.model,
    provider: provider.name,
    rep,
    roundsToGreen,
    firstPass: firstPass as GauntletResult,
    finalPass,
    completions,
    codes,
    contextSha256: sha256(context),
    promptSha256: sha256(scenario.prompt),
    timestamp: new Date().toISOString(),
  };
};

interface CliOptions {
  reps: number;
  scenarios: ScenarioId[];
  libraries: LibraryId[];
  /** Provider specs: `<id>` or `<id>:<model>` (see providers/index.ts). */
  providers: string[];
  dry: boolean;
  runId: string;
}

const parseArgs = (argv: string[]): CliOptions => {
  const options: CliOptions = {
    reps: 5,
    scenarios: SCENARIOS.map((scenario) => {
      return scenario.id;
    }),
    libraries: LIBRARIES.map((library) => {
      return library.id;
    }),
    providers: ['anthropic', 'gemini'],
    dry: false,
    runId: `run-${new Date().toISOString().replace(/[:.]/g, '-')}`,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--dry') {
      options.dry = true;
    } else if (argument === '--reps') {
      options.reps = Number(argv[(index += 1)]);
    } else if (argument === '--run-id') {
      options.runId = argv[(index += 1)];
    } else if (argument === '--scenarios') {
      options.scenarios = argv[(index += 1)].split(',') as ScenarioId[];
    } else if (argument === '--libraries') {
      options.libraries = argv[(index += 1)].split(',') as LibraryId[];
    } else if (argument === '--providers') {
      options.providers = argv[(index += 1)].split(',');
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return options;
};

interface MatrixCell {
  scenario: Scenario;
  library: LibraryCondition;
  provider: Provider;
  rep: number;
}

const buildMatrix = (
  options: CliOptions,
  providers: Provider[]
): MatrixCell[] => {
  const matrix: MatrixCell[] = [];

  for (const provider of providers) {
    for (const libraryId of options.libraries) {
      for (const scenarioId of options.scenarios) {
        for (let rep = 1; rep <= options.reps; rep += 1) {
          matrix.push({
            scenario: getScenario(scenarioId),
            library: getLibrary(libraryId),
            provider,
            rep,
          });
        }
      }
    }
  }

  return matrix;
};

const describeOutcome = (sample: SampleRecord): string => {
  if (sample.roundsToGreen === 0) {
    return 'first-pass PASS';
  }

  if (sample.roundsToGreen === null) {
    return `FAIL (${sample.finalPass?.failedLevel})`;
  }

  return `pass after ${sample.roundsToGreen} repair(s)`;
};

const main = async (): Promise<void> => {
  const options = parseArgs(process.argv.slice(2));

  const providers: Provider[] = options.providers.map(createProvider);

  const matrix = buildMatrix(options, providers);

  console.log(
    `fsl-bench ${options.runId}: ${matrix.length} samples ` +
      `(${options.scenarios.length} scenarios x ${options.libraries.length} libraries x ` +
      `${providers.length} providers x ${options.reps} reps)`
  );

  if (options.dry) {
    for (const cell of matrix) {
      console.log(
        `- ${cell.provider.name}/${cell.provider.model} ${cell.library.id} ${cell.scenario.id} rep=${cell.rep}`
      );
    }
    return;
  }

  const resultsDir = path.join(findPackageRoot(), 'results', options.runId);
  fs.mkdirSync(resultsDir, { recursive: true });
  const samplesPath = path.join(resultsDir, 'samples.jsonl');

  const samples: SampleRecord[] = [];

  for (const [index, cell] of matrix.entries()) {
    const context = loadContext(cell.library);
    const systemPrompt = buildSystemPrompt({
      library: cell.library,
      context,
    });

    process.stdout.write(
      `[${index + 1}/${matrix.length}] ${cell.provider.name} ${cell.library.id} ${cell.scenario.id} rep=${cell.rep} ... `
    );

    try {
      const sample = await runSample({
        runId: options.runId,
        scenario: cell.scenario,
        library: cell.library,
        provider: cell.provider,
        rep: cell.rep,
        context,
        systemPrompt,
      });

      samples.push(sample);
      fs.appendFileSync(samplesPath, `${JSON.stringify(sample)}\n`);

      console.log(describeOutcome(sample));
    } catch (error) {
      console.log(`ERROR ${String(error)}`);
    }
  }

  const report = renderReport({ runId: options.runId, samples });
  fs.writeFileSync(path.join(resultsDir, 'report.md'), report);
  console.log(`\nReport: ${path.join(resultsDir, 'report.md')}`);
};

await main();
