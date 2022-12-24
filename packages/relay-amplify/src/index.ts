import { API, graphqlOperation } from 'aws-amplify';
import {
  Environment,
  FetchFunction,
  Network,
  RecordSource,
  Store,
} from 'relay-runtime';

export const fetchQuery: FetchFunction = async (operation, variables) => {
  try {
    const response = await API.graphql(
      graphqlOperation(operation.text, variables)
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
