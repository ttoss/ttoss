import { hideBin } from 'yargs/helpers';
import { setupCommand } from './commands/setup/setupCommand';
import yargs from 'yargs';

yargs(hideBin(process.argv))
  .option('config', {
    alias: 'c',
    default: 'monorepo.json',
  })
  .config()
  .command(setupCommand)
  .parse();
