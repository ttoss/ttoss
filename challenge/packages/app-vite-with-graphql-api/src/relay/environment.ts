import {
  Environment,
  type FetchFunction,
  Network,
  RecordSource,
  Store,
} from 'relay-runtime';

const fetchQuery: FetchFunction = () => {
  /**
   * TODO: Implement a function to fetch the results of the operation
   * and return them as a Promise.
   * Reference: https://relay.dev/docs/guides/network-layer/
   */
  return Promise.resolve({
    data: {},
  });
};

const network = Network.create(fetchQuery);

const store = new Store(new RecordSource());

export const relayEnvironment = new Environment({
  network,
  store,
});
