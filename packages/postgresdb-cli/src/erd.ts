import * as fs from 'node:fs';
import { getDbDynamically } from './getDbDynamically';
import sequelizeErd from 'sequelize-erd';

export const erd = async ({ dbPath }: { dbPath: string }) => {
  // eslint-disable-next-line no-console
  console.info('Generating ERD...', dbPath);
  const db = await getDbDynamically({ dbPath });
  const svg = await sequelizeErd({ source: db.sequelize });
  await fs.promises.writeFile('erd.svg', svg);
  // eslint-disable-next-line no-console
  console.info('ERD generated at erd.svg');
  db.sequelize.close();
};
