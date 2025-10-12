/* eslint-disable @typescript-eslint/no-explicit-any */
// import { API, Auth, graphqlOperation } from 'aws-amplify';
import { post } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import {
  Environment,
  FetchFunction,
  Network,
  RecordSource,
  Store,
} from 'relay-runtime';

import { encodeCredentials } from './encodeCredentials';

export {
  decodeCredentials,
  encodeCredentials,
  type ICredentials,
} from './encodeCredentials';

export const fetchQuery: FetchFunction = async (operation, variables) => {
  let credentials: string | undefined;

  try {
    const authSession = await fetchAuthSession();

    if (
      authSession.credentials &&
      authSession.identityId &&
      authSession.credentials?.sessionToken
    ) {
      credentials = encodeCredentials({
        accessKeyId: authSession.credentials?.accessKeyId,
        identityId: authSession.identityId,
        sessionToken: authSession.credentials?.sessionToken,
        secretAccessKey: authSession.credentials?.secretAccessKey,
        expiration: authSession.credentials?.expiration,
        authenticated: true,
      });
    }
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error(error?.message);
    credentials = undefined;
  }

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
