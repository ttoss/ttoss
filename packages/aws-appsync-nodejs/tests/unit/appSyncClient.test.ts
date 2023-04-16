import { Config, appSyncClient } from '../../src';

test.each<Config>([
  {
    apiEndpoint: 'https://api.example.com/graphql',
  },
  {
    apiEndpoint: 'https://api.example.com/graphql',
    apiKey: 'da2-1234567890abcdef1234567890abcdef',
  },
])('config %#', (config) => {
  appSyncClient.setConfig(config);
  expect(appSyncClient.config).toBe(config);
});

test('query with API key', async () => {
  const config: Config = {
    apiEndpoint: 'https://api.example.com/graphql',
    apiKey: 'da2-1234567890abcdef1234567890abcdef',
  };

  appSyncClient.setConfig(config);

  const query = 'query { hello }';

  const variables = { v: 1 };

  global.fetch = jest.fn().mockImplementation(async (req: Request) => {
    const body = await req.text();
    const url = req.url;
    const xApiKey = req.headers.get('x-api-key');

    if (
      body === JSON.stringify({ query, variables }) &&
      url === config.apiEndpoint &&
      xApiKey === config.apiKey
    ) {
      return {
        json: () => {
          return Promise.resolve({
            data: {
              hello: 'world',
            },
          });
        },
      };
    }

    throw new Error('Wrong request');
  });

  const response = await appSyncClient.query(query, variables);

  expect(response).toEqual({
    data: {
      hello: 'world',
    },
  });
});
