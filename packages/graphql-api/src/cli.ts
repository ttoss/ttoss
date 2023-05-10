import * as fs from 'fs';
import * as path from 'path';
import { register } from 'ts-node';
import yargs from 'yargs';

register({
  transpileOnly: true,
});

const argv: any = yargs(process.argv.slice(2)).argv;

if (argv._.includes('build-schema')) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { schemaComposer } = require(path.resolve(
    process.cwd(),
    'src',
    'schemaComposer.ts'
  ));

  const sdl = schemaComposer.toSDL();

  /**
   * Save to schema/schema.graphql. schema folder might not exist.
   */
  fs.mkdirSync('schema', { recursive: true });

  fs.writeFileSync('schema/schema.graphql', sdl);
}
