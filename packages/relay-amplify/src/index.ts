/* eslint-disable @typescript-eslint/no-explicit-any */
// import { API, Auth, graphqlOperation } from 'aws-amplify';
import { post } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { FetchFunction } from 'relay-runtime';
import { Environment, Network, RecordSource, Store } from 'relay-runtime';

import { encodeCredentials } from './encodeCredentials';

export {
  decodeCredentials,
  encodeCredentials,
  type ICredentials,
} from './encodeCredentials';

const getCredentials = async (): Promise<string | undefined> => {
  try {
    const { credentials, identityId } = await fetchAuthSession();

    if (credentials && identityId && credentials.sessionToken) {
      return encodeCredentials({
        accessKeyId: credentials.accessKeyId,
        identityId,
        sessionToken: credentials.sessionToken,
        secretAccessKey: credentials.secretAccessKey,
        expiration: credentials.expiration,
        authenticated: true,
      });
    }

    return undefined;
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error(error?.message);
    return undefined;
  }
};

export const fetchQuery: FetchFunction = async (operation, variables) => {
  const credentials = await getCredentials();

  try {
    const headers: { [key: string]: string } = {};

    if (credentials) {
      headers['x-credentials'] = credentials;
    }

    const response = await post({
      apiName: operation.name,
      path: operation.text ?? '',
      options: {
        headers,
        body: JSON.stringify({ variables }),
      },
    });

    return response as any;
  } catch (error: any) {
    if (error.errors && error.errors.length > 0) {
      throw error.errors[0];
    }
    throw error;
  }
};

export const createEnvironment = ({ storeOptions }: { storeOptions?: any }) => {
  return new Environment({
    network: Network.create(fetchQuery),
    store: new Store(new RecordSource(), storeOptions),
  });
};
