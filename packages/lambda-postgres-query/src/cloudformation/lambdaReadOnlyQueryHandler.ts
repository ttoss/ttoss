import type { Handler } from 'aws-lambda';
import { Client } from 'pg';

import type { QueryParams } from '../query';

const databaseReadOnly = process.env.DATABASE_NAME_READ_ONLY;
const usernameReadOnly = process.env.DATABASE_USERNAME_READ_ONLY;
const passwordReadOnly = process.env.DATABASE_PASSWORD_READ_ONLY;
const hostReadOnly = process.env.DATABASE_HOST_READ_ONLY;
const portReadOnly = process.env.DATABASE_PORT_READ_ONLY;

// Partial overrides are intentional: each connection parameter can be
// independently overridden via its _READ_ONLY variant. Any parameter without
// a _READ_ONLY override falls back to the corresponding non-read-only env var.
// This allows, for example, pointing only the host to a read replica while
// reusing the same credentials as the primary database.
const getConnectionConfig = () => {
  return {
    database: databaseReadOnly || process.env.DATABASE_NAME,
    username: usernameReadOnly || process.env.DATABASE_USERNAME,
    password: passwordReadOnly || process.env.DATABASE_PASSWORD,
    host: hostReadOnly || process.env.DATABASE_HOST,
    port: portReadOnly || process.env.DATABASE_PORT,
  };
};

export const readOnlyHandler: Handler<QueryParams> = async (event) => {
  if (
    !databaseReadOnly &&
    !usernameReadOnly &&
    !passwordReadOnly &&
    !hostReadOnly &&
    !portReadOnly
  ) {
    throw new Error(
      'At least one read-only override must be defined (DATABASE_NAME_READ_ONLY, DATABASE_USERNAME_READ_ONLY, DATABASE_PASSWORD_READ_ONLY, DATABASE_HOST_READ_ONLY, DATABASE_PORT_READ_ONLY). Unset overrides fall back to the corresponding non-read-only env vars.'
    );
  }

  const { database, username, password, host, port } = getConnectionConfig();

  try {
    const client = new Client({
      database,
      user: username,
      password,
      host,
      port: Number(port),
    });

    await client.connect();

    try {
      await client.query('BEGIN READ ONLY');

      try {
        const res = await client.query(event);
        await client.query('COMMIT');
        return res;
      } catch (queryError) {
        await client.query('ROLLBACK');
        throw queryError;
      }
    } finally {
      await client.end();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error running read-only query', {
      error,
      event,
    });
    throw error;
  }
};
