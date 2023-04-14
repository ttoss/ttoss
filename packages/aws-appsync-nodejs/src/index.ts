/**
 * Implementation of the AppSync client for NodeJS, based on the AWS Amplify
 * documentation: https://docs.amplify.aws/lib/graphqlapi/graphql-from-nodejs/q/platform/js/
 */
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

export type Config = {
  apiEndpoint: string;
  apiKey?: string;
  awsCredentials?: AwsCredentialIdentity;
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

const getRegionFromEndpoint = (endpoint: string): string => {
  const matcher = /\.[a-z]+-[a-z]+-[0-9]\./;
  const regexResponse = endpoint.match(matcher);
  let region = '';
  if (regexResponse) {
    region = regexResponse[0].replace(/\./g, '');
  }
  return region;
};

const queryWithCredentials: Query = async (query, variables) => {
  const { apiEndpoint, awsCredentials } = _config;

  const endpoint = new URL(apiEndpoint);

  const region = getRegionFromEndpoint(apiEndpoint);

  const signer = new SignatureV4({
    credentials: awsCredentials || defaultProvider(),
    region,
    service: 'appsync',
    sha256: Sha256,
  });

  const requestToBeSigned = new HttpRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: endpoint.host,
    },
    hostname: endpoint.host,
    body: JSON.stringify({ query, variables }),
    path: endpoint.pathname,
  });

  const signed = await signer.sign(requestToBeSigned);

  const request = new Request(endpoint, signed);

  const response = await fetch(request);

  const body = await response.json();

  return body;
};

const query: Query = async (query, variables) => {
  if (_config.apiKey) {
    return queryWithApiKey(query, variables);
  }

  return queryWithCredentials(query, variables);
};

export const appSyncClient = {
  query,
  setConfig,
  get config() {
    return _config;
  },
};
