/**
 * Implementation of the AppSync client for NodeJS, based on the AWS Amplify
 * documentation: https://docs.amplify.aws/lib/graphqlapi/graphql-from-nodejs/q/platform/js/
 */
import { Request, RequestInit, default as fetch } from 'node-fetch';

export type Config = {
  apiEndpoint: string;
  apiKey?: string;
  awsCredentials?: any;
};

let _config: Config;

const setConfig = (config: Config) => {
  _config = config;
};

export type Query = (
  query: string,
  variables: Record<string, unknown>
) => Promise<{
  data: Record<string, unknown> | null;
  errors?: {
    message: string;
    path: string | null;
    locations: any[];
  }[];
}>;

const queryWithApiKey: Query = async (query, variables) => {
  const { apiEndpoint, apiKey } = _config;

  if (!apiKey) {
    throw new Error('No API Key set');
  }

  const options: RequestInit = {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ query, variables }),
  };

  const request = new Request(apiEndpoint, options);

  const response = await fetch(request);

  const body = await response.json();

  return body;
};

const query: Query = async (query, variables) => {
  if (_config.apiKey) {
    return queryWithApiKey(query, variables);
  }

  if (_config.awsCredentials) {
    return { data: null };
  }

  throw new Error('No API key or credentials set');
};

export const appSyncClient = {
  query,
  setConfig,
  get config() {
    return _config;
  },
};
