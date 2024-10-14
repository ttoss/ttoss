import { getDbDynamically } from './getDbDynamically';

export const sync = async ({
  alter,
  dbPath,
}: {
  alter: boolean;
  dbPath: string;
}) => {
  const db = await getDbDynamically({ dbPath });

  await db.sequelize.sync({
    /**
     * Don't force anymore because it's better to run migrations.
     */
    force: false,
    alter,
  });

  // eslint-disable-next-line no-console
  console.info('Database synced (alter: %s)', alter);

  db.sequelize.close();
};
