import * as readline from 'node:readline';

import { getDbDynamically } from './getDbDynamically';

const confirmAlter = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Do you want to continue? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
};

export const sync = async ({
  alter,
  dbPath,
  environment,
}: {
  alter: boolean;
  dbPath: string;
  environment: string;
}) => {
  // eslint-disable-next-line no-console
  console.info('Starting database synchronization...');
  // eslint-disable-next-line no-console
  console.info('Environment: %s', environment || 'default (.env)');
  // eslint-disable-next-line no-console
  console.info('DB Path: %s', dbPath);
  // eslint-disable-next-line no-console
  console.info(
    'Mode: %s',
    alter ? 'ALTER (will modify schema)' : 'SAFE (create tables only)'
  );

  // Confirmation prompt for alter mode
  if (alter) {
    // eslint-disable-next-line no-console
    console.warn('\n⚠️  WARNING: ALTER mode will modify your database schema!');
    // eslint-disable-next-line no-console
    console.warn('   - Columns not in models will be DELETED (data loss!)');
    // eslint-disable-next-line no-console
    console.warn('   - New columns will be added');
    // eslint-disable-next-line no-console
    console.warn('   - Tables not in models will be preserved\n');

    const confirmed = await confirmAlter();

    if (!confirmed) {
      // eslint-disable-next-line no-console
      console.info('Synchronization cancelled.');
      process.exit(0);
    }
  }

  // eslint-disable-next-line no-console
  console.info('\nConnecting to database...');
  const db = await getDbDynamically({ dbPath, environment });

  // eslint-disable-next-line no-console
  console.info('Synchronizing schema...');
  await db.sequelize.sync({
    /**
     * Don't force anymore because it's better to run migrations.
     */
    force: false,
    alter,
  });

  // eslint-disable-next-line no-console
  console.info('✓ Database synchronized successfully (alter: %s)', alter);

  db.sequelize.close();
};
