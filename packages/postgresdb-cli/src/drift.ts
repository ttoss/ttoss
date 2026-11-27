import type { Sequelize } from '@ttoss/postgresdb';

import { getDbDynamically } from './getDbDynamically';

export type Drift = {
  database: string;
  user: string;
  /**
   * Columns, or whole tables as `<table> (table)`, that the models declare
   * and the database lacks: what `sync` adds.
   */
  toAdd: string[];
  /**
   * Columns of a model's table that the model does not declare: what
   * `sync --alter` drops.
   */
  toDrop: string[];
};

/**
 * Compares the `public` schema against the models registered on `sequelize`.
 * Tables no model declares are left out, because `sync --alter` keeps them.
 */
export const getDrift = async ({
  sequelize,
}: {
  sequelize: Sequelize;
}): Promise<Drift> => {
  const [[identity]] = (await sequelize.query(
    'SELECT current_database() AS database, current_user AS user'
  )) as [Array<{ database: string; user: string }>, unknown];

  const [rows] = (await sequelize.query(
    "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'"
  )) as [Array<{ table_name: string; column_name: string }>, unknown];

  const columnsByTable = new Map<string, Set<string>>();

  for (const { table_name, column_name } of rows) {
    const columns = columnsByTable.get(table_name) ?? new Set<string>();
    columns.add(column_name);
    columnsByTable.set(table_name, columns);
  }

  const toAdd: string[] = [];
  const toDrop: string[] = [];

  for (const model of Object.values(sequelize.models)) {
    const tableName = model.getTableName();
    const table =
      typeof tableName === 'string' ? tableName : tableName.tableName;
    const fields = new Set(
      Object.values(model.getAttributes()).map((attribute) => {
        return attribute.field as string;
      })
    );
    const columns = columnsByTable.get(table);

    if (!columns) {
      toAdd.push(`${table} (table)`);
      continue;
    }

    for (const column of columns) {
      if (!fields.has(column)) {
        toDrop.push(`${table}.${column}`);
      }
    }

    for (const field of fields) {
      if (!columns.has(field)) {
        toAdd.push(`${table}.${field}`);
      }
    }
  }

  return { database: identity.database, user: identity.user, toAdd, toDrop };
};

const formatList = (items: string[]) => {
  return items.length > 0 ? items.join(', ') : 'none';
};

/**
 * `ttoss-postgresdb drift`: prints what `sync` would add and what
 * `sync --alter` would drop. Exits `1` when something would be dropped, so
 * `drift && sync --alter` stops before data loss.
 */
export const drift = async ({
  dbPath,
  environment,
}: {
  dbPath: string;
  environment: string;
}) => {
  const db = await getDbDynamically({ dbPath, environment });
  const sequelize: Sequelize = db.sequelize;

  try {
    const { database, user, toAdd, toDrop } = await getDrift({ sequelize });

    // eslint-disable-next-line no-console
    console.info('Database: %s (user: %s)', database, user);
    // eslint-disable-next-line no-console
    console.info(
      'In the models, not in the database (sync adds): %s',
      formatList(toAdd)
    );
    // eslint-disable-next-line no-console
    console.info(
      'In the database, not in the models (sync --alter drops): %s',
      formatList(toDrop)
    );

    process.exitCode = toDrop.length > 0 ? 1 : 0;
  } finally {
    await sequelize.close();
  }
};
