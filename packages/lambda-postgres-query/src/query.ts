import {
  InvokeCommand,
  type InvokeCommandInput,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import camelcaseKeys from 'camelcase-keys';
import type { QueryConfig, QueryResult, QueryResultRow } from 'pg';

const lambdaClient = new LambdaClient();

const asciiDecoder = new TextDecoder('ascii');

export type QueryParams = {
  readOnly?: boolean;
  lambdaPostgresQueryFunction?: string;
} & QueryConfig;

export type LambdaError = {
  errorType: 'Error';
  errorMessage: string;
  trace: string[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const query = async <Rows extends QueryResultRow = any>(
  params: QueryParams | string
) => {
  try {
    const {
      readOnly = true,
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      lambdaPostgresQueryFunction = process.env.LAMBDA_POSTGRES_QUERY_FUNCTION,
      ...pgParams
    } = typeof params === 'string'
      ? {
          text: params,
        }
      : params;

    const input: InvokeCommandInput = {
      FunctionName: lambdaPostgresQueryFunction,
      Payload: JSON.stringify({ readOnly, ...pgParams }),
    };

    const { Payload } = await lambdaClient.send(new InvokeCommand(input));

    if (!Payload) {
      // eslint-disable-next-line no-console
      console.error('No payload returned from lambda query', { input });
      throw new Error('No payload returned from lambda query');
    }

    const data = asciiDecoder.decode(Payload);

    const result = JSON.parse(data) as QueryResult<Rows> | LambdaError;

    if ('errorType' in result) {
      throw result;
    }

    return {
      ...result,
      rows: result.rows.map((row) => {
        return {
          ...row,
          ...camelcaseKeys(row, { deep: true }),
        };
      }),
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error invoking Lambda: ', error);
    throw error;
  }
};
