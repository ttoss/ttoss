import {
  Environment,
  FetchFunction,
  Network,
  RecordSource,
  Store,
} from 'relay-runtime';

const fetchQuery: FetchFunction = (operation, variables) => {
  return fetch(import.meta.env.VITE_APPSYNC_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: operation.text,
      variables,
    }),
  }).then((response) => {
    return response.json();
  });
};

export const environment = new Environment({
  network: Network.create(fetchQuery),
  store: new Store(new RecordSource()),
  requiredFieldLogger: (args) => {
    // eslint-disable-next-line no-console
    console.error(args);
  },
});
