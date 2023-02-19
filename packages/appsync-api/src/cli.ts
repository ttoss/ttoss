import * as fs from 'fs';
import { findAndReadCloudFormationTemplate } from '@ttoss/cloudformation';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));

if (argv._.includes('build-schema')) {
  const template = findAndReadCloudFormationTemplate({});

  const sdl = template.Metadata.Schema.Definition;

  /**
   * Save to schema/schema.graphql. schema folder might not exist.
   */
  fs.mkdirSync('schema', { recursive: true });

  fs.writeFileSync('schema/schema.graphql', sdl);
}
