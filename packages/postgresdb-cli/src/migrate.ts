import type { Migration } from '@ttoss/postgresdb';
import { runMigrationsCli } from '@ttoss/postgresdb';

import { loadModuleDynamically } from './loadModuleDynamically';

type MigrationsModule = {
  migrations?: Migration[];
  sync?: () => Promise<void>;
};

/**
 * `ttoss-postgresdb migrate`: loads the project's migrations file and hands
 * the rest of the command line to `runMigrationsCli`, so `status`, `run` and
 * `baseline` behave exactly as they do from an application's own entrypoint.
 */
export const migrate = async (
  args: string[],
  {
    environment,
    migrationsPath,
    tag,
  }: {
    environment: string;
    migrationsPath: string;
    tag?: string;
  }
) => {
  const loaded = await loadModuleDynamically<MigrationsModule>({
    modulePath: migrationsPath,
    environment,
  });

  if (!Array.isArray(loaded.migrations)) {
    // eslint-disable-next-line no-console
    console.error(
      `${migrationsPath} must export \`migrations\`: an array built with defineMigration from @ttoss/postgresdb.`
    );
    process.exitCode = 2;

    return;
  }

  process.exitCode = await runMigrationsCli({
    argv: args,
    bin: 'ttoss-postgresdb migrate -e <environment>',
    migrations: loaded.migrations,
    sync: loaded.sync,
    version: tag,
  });
};
