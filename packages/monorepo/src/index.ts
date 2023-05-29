import * as yargs from 'yargs';
import { setupCommand } from './commands/setup/setupCommand';

yargs
  .option('config', {
    alias: 'c',
    default: 'monorepo.json',
  })
  .config()
  .command(setupCommand)
  .parse();
