// import { AppSyncGraphQLSchemaLogicalId } from './createApiTemplate';
import * as fs from 'fs';
import { findAndReadCloudFormationTemplate } from '@ttoss/cloudformation';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));

/**
 * TODO: fix Error: Cannot find module 'carlin/src/deploy/lambdaLayer/getPackageLambdaLayerStackName'
 * passing all carlin cloudformation methods to @ttoss/cloudformation and
 * import AppSyncGraphQLSchemaLogicalId from './createApiTemplate';
 */
const AppSyncGraphQLSchemaLogicalId = 'AppSyncGraphQLSchema';

if (argv._.includes('build-schema')) {
  const template = findAndReadCloudFormationTemplate({});

  const sdl =
    template.Resources[AppSyncGraphQLSchemaLogicalId].Properties.Definition;

  /**
   * Save to schema/schema.graphql. schema folder might not exist.
   */
  fs.mkdirSync('schema', { recursive: true });

  fs.writeFileSync('schema/schema.graphql', sdl);
}
