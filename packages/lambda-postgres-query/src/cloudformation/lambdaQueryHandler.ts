/* eslint-disable turbo/no-undeclared-env-vars */
import { Client } from 'pg';
import type { Handler } from 'aws-lambda';
import type { QueryParams } from '../query';

const database = process.env.DATABASE_NAME;
const username = process.env.DATABASE_USERNAME;
const password = process.env.DATABASE_PASSWORD;
const host = process.env.DATABASE_HOST;
const hostReadOnly = process.env.DATABASE_HOST_READ_ONLY;
const port = process.env.DATABASE_PORT;

export const handler: Handler<QueryParams> = async (event) => {
  try {
    const client = new Client({
      database,
      user: username,
      password,
      host: event.readOnly && hostReadOnly ? hostReadOnly : host,
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
    console.error('Error running query', error);
    throw error;
  }
};
