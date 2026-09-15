import { loadModuleDynamically } from './loadModuleDynamically';

export const getDbDynamically = async ({
  dbPath,
  environment,
}: {
  dbPath: string;
  environment?: string;
}) => {
  const { db } = await loadModuleDynamically<{ db: never }>({
    modulePath: dbPath,
    environment,
  });

  return db;
};
