import {
  InvokeCommand,
  type InvokeCommandInput,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import camelcaseKeys from 'camelcase-keys';
import type { QueryConfig, QueryResult, QueryResultRow } from 'pg';

const lambdaClient = new LambdaClient();

const textDecoder = new TextDecoder('utf-8');

export type QueryParams = {
  functionName?: string;
  camelCaseKeys?: boolean;
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
      functionName,
      camelCaseKeys = true,
      ...pgParams
    } = typeof params === 'string'
      ? {
          text: params,
        }
      : params;

    const input: InvokeCommandInput = {
      FunctionName:
        functionName || process.env.LAMBDA_POSTGRES_QUERY_FUNCTION_NAME,
      Payload: JSON.stringify({ ...pgParams }),
    };

    const { Payload } = await lambdaClient.send(new InvokeCommand(input));

    if (!Payload) {
      // eslint-disable-next-line no-console
      console.error('No payload returned from lambda query', { input });
      throw new Error('No payload returned from lambda query');
    }

    const data = textDecoder.decode(Payload);

    const result = JSON.parse(data) as QueryResult<Rows> | LambdaError;

    if ('errorType' in result) {
      throw new Error(result.errorMessage);
    }

    return {
      ...result,
      rows: result.rows.map((row) => {
        if (!camelCaseKeys) {
          return row;
        }

        return {
          ...row,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(camelcaseKeys(row, { deep: true }) as any),
        };
      }),
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error invoking lambda-postgres-query: ', error);
    throw error;
  }
};
