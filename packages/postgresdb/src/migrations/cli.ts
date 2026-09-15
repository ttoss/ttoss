import type { MigrationRunner, MigrationRunnerOptions } from './runner';
import { createMigrationRunner } from './runner';
import type { Migration, MigrationArgs } from './types';

export type RunMigrationsCliOptions = MigrationRunnerOptions & {
  /** The command line, without the executable and script: `process.argv.slice(2)`. */
  argv: string[];
  /** How the program is named in usage text. @default 'migrate' */
  bin?: string;
  /** Where `status` and `help` write. @default stdout */
  print?: (message: string) => void;
};

type ParsedArgv = {
  command: string | undefined;
  positionals: string[];
  flags: MigrationArgs;
};

const COMMANDS = ['status', 'run', 'baseline'];

/**
 * `--flag value`, `--flag=value` and a bare `--flag` (which reads as `true`).
 * A value never starts with `--`, so `--dry-run --owner-email a@b` parses as
 * two flags rather than one with a strange value.
 */
export const parseArgv = (argv: string[]): ParsedArgv => {
  const positionals: string[] = [];
  const flags: MigrationArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      positionals.push(token);

      continue;
    }

    const body = token.slice(2);
    const equals = body.indexOf('=');

    if (equals !== -1) {
      flags[body.slice(0, equals)] = body.slice(equals + 1);

      continue;
    }

    const next = argv[index + 1];
    const takesValue = next !== undefined && !next.startsWith('--');

    flags[body] = takesValue ? next : true;
    index += takesValue ? 1 : 0;
  }

  const [command, ...rest] = positionals;

  return { command, positionals: rest, flags };
};

const usage = (args: { bin: string; migrations: Migration[] }): string => {
  const { bin, migrations } = args;

  const lines = [
    `Usage: ${bin} <command> [options]`,
    '',
    'Commands:',
    '  status                          Every migration and when it was applied.',
    '  run [name...] [--dry-run]       Apply what is pending, or only the named ones.',
    '                                  --dry-run reports and writes nothing.',
    '                                  --allow-unbaselined runs against a populated',
    '                                  database whose ledger is empty.',
    '  baseline (<name...> | --all)    Record migrations as applied without running',
    '                                  them, for a database migrated before the ledger.',
    '  help',
    '',
    'Migrations, in the order they run:',
  ];

  for (const migration of migrations) {
    lines.push(`  ${migration.name}`);

    if (migration.description) {
      lines.push(`      ${migration.description}`);
    }

    for (const option of migration.options ?? []) {
      lines.push(
        `      --${option.flag}${option.required ? ' (required)' : ''}  ${option.description}`
      );
    }
  }

  return lines.join('\n');
};

const defaultLog = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

const formatDate = (date: Date | string): string => {
  return new Date(date).toISOString();
};

const statusCommand = async (params: {
  runner: MigrationRunner;
  print: (message: string) => void;
}): Promise<number> => {
  const { runner, print } = params;

  const report = await runner.status();

  for (const entry of report.migrations) {
    if (entry.applied) {
      const how = entry.applied.baseline ? 'baseline' : 'applied';
      const by = entry.applied.version ? ` by ${entry.applied.version}` : '';

      print(
        `${entry.name}  ${how} ${formatDate(entry.applied.applied_at)}${by}`
      );
    } else {
      print(`${entry.name}  pending`);
    }
  }

  for (const row of report.unknown) {
    print(
      `${row.name}  in the ledger (${formatDate(row.applied_at)}) but not declared`
    );
  }

  return report.unknown.length > 0 ? 1 : 0;
};

const runCommand = async (params: {
  runner: MigrationRunner;
  names: string[];
  flags: MigrationArgs;
  log: (message: string) => void;
}): Promise<number> => {
  const { runner, names, flags, log } = params;

  const {
    'dry-run': dryRun,
    'allow-unbaselined': allowUnbaselined,
    ...args
  } = flags;

  const result = await runner.run({
    names,
    dryRun: dryRun === true,
    // Spread rather than passed outright: the flag can only turn the guard
    // off, never back on over a runner that already defaults it off.
    ...(allowUnbaselined === true ? { allowUnbaselined: true } : {}),
    args,
  });

  for (const name of result.skipped) {
    log(`${name}: already applied, skipped`);
  }

  return 0;
};

/**
 * The command a deploy runs: parses `argv`, drives a migration runner and
 * returns the exit code rather than calling `process.exit`, so the caller
 * decides how the process ends.
 *
 * @example
 * ```ts
 * runMigrationsCli({ argv: process.argv.slice(2), migrations, sync }).then(
 *   (code) => {
 *     process.exitCode = code;
 *   }
 * );
 * ```
 */
/**
 * Whether the command line asks for usage rather than for work, and with which
 * exit code. `null` means there is a command to run.
 */
const usageCode = (params: {
  command: string | undefined;
  flags: MigrationArgs;
  help: string;
  print: (message: string) => void;
  log: (message: string) => void;
}): number | null => {
  const { command, flags, help, print, log } = params;

  const askedForHelp = command === 'help' || flags.help === true;

  if (!command || askedForHelp) {
    print(help);

    // No command at all is a misuse; asking for help is not.
    return askedForHelp ? 0 : 2;
  }

  if (!COMMANDS.includes(command)) {
    log(`Unknown command "${command}".\n`);
    print(help);

    return 2;
  }

  return null;
};

const dispatch = async (params: {
  command: string;
  runner: MigrationRunner;
  positionals: string[];
  flags: MigrationArgs;
  print: (message: string) => void;
  log: (message: string) => void;
}): Promise<number> => {
  const { command, runner, positionals, flags, print, log } = params;

  if (command === 'status') {
    return statusCommand({ runner, print });
  }

  if (command === 'run') {
    return runCommand({ runner, names: positionals, flags, log });
  }

  await runner.baseline({ names: positionals, all: flags.all === true });

  return 0;
};

export const runMigrationsCli = async ({
  argv,
  bin = 'migrate',
  print = (message) => {
    process.stdout.write(`${message}\n`);
  },
  ...runnerOptions
}: RunMigrationsCliOptions): Promise<number> => {
  const log = runnerOptions.log ?? defaultLog;

  const { command, positionals, flags } = parseArgv(argv);
  const help = usage({ bin, migrations: runnerOptions.migrations });

  const asked = usageCode({ command, flags, help, print, log });

  if (asked !== null) {
    return asked;
  }

  const runner = createMigrationRunner({ ...runnerOptions, log });

  try {
    return await dispatch({
      command: command as string,
      runner,
      positionals,
      flags,
      print,
      log,
    });
  } catch (error) {
    log(error instanceof Error ? error.message : String(error));

    return 1;
  } finally {
    await runner.close();
  }
};
