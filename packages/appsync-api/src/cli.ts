import * as fs from 'fs';
import { AppSyncGraphQLSchemaLogicalId } from './createApiTemplate';
import { findAndReadCloudFormationTemplate } from '@ttoss/cloudformation';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));

if (argv._.includes('build-schema')) {
  const template = findAndReadCloudFormationTemplate({});

  const sdl =
    template.Resources[AppSyncGraphQLSchemaLogicalId].Properties.Definition;

  // eslint-disable-next-line no-console
  console.log(sdl);

  /**
   * Save to schema/schema.graphql. schema folder might not exist.
   */
  fs.mkdirSync('schema', { recursive: true });

  fs.writeFileSync('schema/schema.graphql', sdl);
}
