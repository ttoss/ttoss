/**
 * Implementation of the AppSync client for NodeJS, based on the AWS Amplify
 * documentation: https://docs.amplify.aws/lib/graphqlapi/graphql-from-nodejs/q/platform/js/
 */
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { HttpRequest } from '@smithy/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';
import { SignatureV4 } from '@smithy/signature-v4';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

export type Config = {
  endpoint: string;
  region?: string;
  apiKey?: string;
  credentials?: AwsCredentialIdentity;
};

let _config: Config;

const setConfig = (config: Config) => {
  _config = config;
};

export type Query = (
  query: string,
  variables?: Record<string, unknown>
) => Promise<{
  data: Record<string, unknown> | null;
  errors?: {
    message: string;
    path: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    locations: any[];
  }[];
}>;

const queryWithApiKey: Query = async (query, variables) => {
  const { endpoint, apiKey } = _config;

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

  const request = new Request(endpoint, options);

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
  const endpoint = new URL(_config.endpoint);

  const region = _config.region || getRegionFromEndpoint(_config.endpoint);

  const signer = new SignatureV4({
    credentials: _config.credentials || defaultProvider(),
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
    protocol: endpoint.protocol,
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
