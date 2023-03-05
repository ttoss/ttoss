import { API, Auth, graphqlOperation } from 'aws-amplify';
import {
  Environment,
  FetchFunction,
  Network,
  RecordSource,
  Store,
} from 'relay-runtime';
import { encodeCredentials } from './encodeCredentials';

export {
  encodeCredentials,
  decodeCredentials,
  ICredentials,
} from './encodeCredentials';

export const fetchQuery: FetchFunction = async (operation, variables) => {
  let credentials: string | undefined;

  try {
    const currentCredentials = await Auth.currentCredentials();

    credentials = encodeCredentials(currentCredentials);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error(err?.message);
    credentials = undefined;
  }

  try {
    const headers: { [key: string]: string } = {};

    if (credentials) {
      headers['x-credentials'] = credentials;
    }

    const response = await API.graphql(
      graphqlOperation(operation.text, variables),
      headers
    );

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
