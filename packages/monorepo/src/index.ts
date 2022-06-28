import * as yargs from 'yargs';
import { setupMonorepoCommand } from './setupMonorepoCommand';

yargs.command(setupMonorepoCommand).parse();
