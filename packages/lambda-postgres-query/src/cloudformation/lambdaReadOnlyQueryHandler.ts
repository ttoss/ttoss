/* eslint-disable turbo/no-undeclared-env-vars */
import type { Handler } from 'aws-lambda';
import { Client } from 'pg';

import type { QueryParams } from '../query';

const database = process.env.DATABASE_NAME_READ_ONLY;
const username = process.env.DATABASE_USERNAME_READ_ONLY;
const password = process.env.DATABASE_PASSWORD_READ_ONLY;
const host = process.env.DATABASE_HOST_READ_ONLY;
const port = process.env.DATABASE_PORT;

export const readOnlyHandler: Handler<QueryParams> = async (event) => {
  const queryText = typeof event === 'string' ? event : event.text;

  if (queryText && !/^\s*SELECT\s/i.test(queryText)) {
    throw new Error('Read-only Lambda only supports SELECT queries.');
  }

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
      const res = await client.query(event);
      return res;
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
