import { Command } from 'commander';

import pkg from '../package.json';
import { erd } from './erd';
import { migrate } from './migrate';
import { sync } from './sync';

const program = new Command();

program
  .name('ttoss-postgresdb')
  .version(pkg.version)
  .description('ttoss postgresdb CLI')
  // So `migrate -e Dev run --dry-run` hands `--dry-run` to the migration
  // command instead of rejecting it as an unknown option of this program.
  .enablePositionalOptions();

program
  .command('sync')
  .description('Sync database')
  .action(sync)
  .option('--alter', 'Alter sync', false)
  .option('-d, --db-path <dbPath>', 'db initialization file path', 'src/db.ts')
  .requiredOption(
    '-e, --environment <environment>',
    'Environment name to load .env.<environment> file'
  );

program
  .command('erd')
  .description('Generate ERD')
  .action(erd)
  .option('-d, --db-path <dbPath>', 'db initialization file path', 'src/db.ts')
  .option('--engine <engine>', 'Layout engine to use', 'circo');

program
  .command('migrate')
  .description(
    'Run, list or baseline the migrations exported by the migrations file'
  )
  .argument(
    '[args...]',
    'status | run [name...] [--dry-run] [--<flag> <value>] | baseline (<name...> | --all) | help'
  )
  .passThroughOptions()
  .allowUnknownOption()
  .action(migrate)
  .option(
    '-m, --migrations-path <migrationsPath>',
    'file exporting `migrations` and, optionally, `sync`',
    'src/migrations.ts'
  )
  .option(
    '--tag <tag>',
    'recorded with every migration this run applies, e.g. the release version'
  )
  .requiredOption(
    '-e, --environment <environment>',
    'Environment name to load .env.<environment> file'
  );

program.parse(process.argv);
