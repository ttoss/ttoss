/* eslint-disable turbo/no-undeclared-env-vars */
import type { Handler } from 'aws-lambda';
import { Client } from 'pg';

import type { QueryParams } from '../query';

const databaseReadOnly = process.env.DATABASE_NAME_READ_ONLY;
const usernameReadOnly = process.env.DATABASE_USERNAME_READ_ONLY;
const passwordReadOnly = process.env.DATABASE_PASSWORD_READ_ONLY;
const hostReadOnly = process.env.DATABASE_HOST_READ_ONLY;
const port = process.env.DATABASE_PORT;

export const readOnlyHandler: Handler<QueryParams> = async (event) => {
  if (
    !databaseReadOnly &&
    !usernameReadOnly &&
    !passwordReadOnly &&
    !hostReadOnly
  ) {
    throw new Error(
      'At least one read-only environment variable must be defined: DATABASE_NAME_READ_ONLY, DATABASE_USERNAME_READ_ONLY, DATABASE_PASSWORD_READ_ONLY, DATABASE_HOST_READ_ONLY'
    );
  }

  const database = databaseReadOnly || process.env.DATABASE_NAME;
  const username = usernameReadOnly || process.env.DATABASE_USERNAME;
  const password = passwordReadOnly || process.env.DATABASE_PASSWORD;
  const host = hostReadOnly || process.env.DATABASE_HOST;

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
