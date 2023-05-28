import * as yargs from 'yargs';
import { setupCommand } from './commands/setup/setupCommand';

yargs.command(setupCommand).parse();
