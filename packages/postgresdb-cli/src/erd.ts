import * as fs from 'node:fs';

import sequelizeErd from 'sequelize-erd';

import { getDbDynamically } from './getDbDynamically';

export const erd = async ({
  dbPath,
  engine,
}: {
  dbPath: string;
  engine: string;
}) => {
  // eslint-disable-next-line no-console
  console.info('Generating ERD...', dbPath);
  const db = await getDbDynamically({ dbPath });
  const svg = await sequelizeErd({ source: db.sequelize, engine });
  await fs.promises.writeFile('erd.svg', svg);
  // eslint-disable-next-line no-console
  console.info('ERD generated at erd.svg');
  db.sequelize.close();
};
