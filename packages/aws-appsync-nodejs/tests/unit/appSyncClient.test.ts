jest.mock('node-fetch', () => {
  return {
    ...jest.requireActual('node-fetch'),
    __esModule: true,
    default: jest.fn(),
    Request: jest.fn(),
  };
});

import * as nodeFetchModule from 'node-fetch';
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
  (nodeFetchModule.default as unknown as jest.Mock).mockImplementation(() => {
    return Promise.resolve({
      json: () => {
        return Promise.resolve({
          data: {
            hello: 'world',
          },
        });
      },
    });
  });

  const config: Config = {
    apiEndpoint: 'https://api.example.com/graphql',
    apiKey: 'da2-1234567890abcdef1234567890abcdef',
  };

  appSyncClient.setConfig(config);

  const query = 'query { hello }';

  const variables = { v: 1 };

  /**
   * Spy on the Request constructor
   */
  const RequestSpy = jest.spyOn(nodeFetchModule, 'Request');

  const response = await appSyncClient.query(query, variables);

  expect(RequestSpy).toHaveBeenCalledWith(
    config.apiEndpoint,
    expect.objectContaining({
      body: JSON.stringify({ query, variables }),
      headers: {
        'x-api-key': config.apiKey,
      },
      method: 'POST',
    })
  );

  expect(response).toEqual({
    data: {
      hello: 'world',
    },
  });
});
