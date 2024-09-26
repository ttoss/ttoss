import { Command } from 'commander';
import { erd } from './erd';
import { sync } from './sync';
import pkg from '../package.json';

const program = new Command();

program
  .name('ttoss-postgresdb')
  .version(pkg.version)
  .description('ttoss postgresdb CLI');

program
  .command('sync')
  .description('Sync database')
  .action(sync)
  .option('--alter', 'Alter sync', false)
  .option('-d, --db-path <dbPath>', 'db initialization file path', 'src/db.ts');

program
  .command('erd')
  .description('Generate ERD')
  .action(erd)
  .option('-d, --db-path <dbPath>', 'db initialization file path', 'src/db.ts');

program.parse(process.argv);
