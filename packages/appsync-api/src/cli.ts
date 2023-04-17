import * as fs from 'fs';
import { findAndReadCloudFormationTemplate } from '@ttoss/cloudformation';
import yargs from 'yargs';

const argv: any = yargs(process.argv.slice(2)).argv;

if (argv._.includes('build-schema')) {
  const template = findAndReadCloudFormationTemplate({});

  const sdl = template.Metadata.Schema.Definition;

  /**
   * Save to schema/schema.graphql. schema folder might not exist.
   */
  fs.mkdirSync('schema', { recursive: true });

  fs.writeFileSync('schema/schema.graphql', sdl);
}
