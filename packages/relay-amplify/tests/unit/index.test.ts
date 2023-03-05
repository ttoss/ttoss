jest.mock('aws-amplify');

import { API, Auth } from 'aws-amplify';
import {
  createEnvironment,
  decodeCredentials,
  encodeCredentials,
  fetchQuery,
} from '../../src';

const mockCredentials = {
  accessKeyId: 'accessKeyId',
  secretAccessKey: 'secretAccessKey',
  sessionToken: 'sessionToken',
  identityId: 'identityId',
  authenticated: true,
};

test('should export createEnvironment', () => {
  expect(createEnvironment).toBeDefined();
});

test('should encode and decode properly', () => {
  const encoded = encodeCredentials(mockCredentials);

  expect(decodeCredentials(encoded)).toEqual({
    accessKeyId: mockCredentials.accessKeyId,
    secretAccessKey: mockCredentials.secretAccessKey,
    sessionToken: mockCredentials.sessionToken,
  });
});

describe('test fetchQuery', () => {
  test('should return credentials on header', async () => {
    jest.spyOn(Auth, 'currentCredentials').mockResolvedValue(mockCredentials);

    jest.spyOn(API, 'graphql').mockImplementation(async (_, headers) => {
      return headers as any;
    });

    const spyReturn = (await fetchQuery(
      { text: 'query' } as any,
      {},
      {}
    )) as any;

    expect(decodeCredentials(spyReturn['x-credentials'])).toEqual({
      accessKeyId: mockCredentials.accessKeyId,
      secretAccessKey: mockCredentials.secretAccessKey,
      sessionToken: mockCredentials.sessionToken,
    });
  });

  test('should NOT return credentials on header', async () => {
    jest
      .spyOn(Auth, 'currentCredentials')
      .mockRejectedValue(new Error('No credentials'));

    jest.spyOn(API, 'graphql').mockImplementation(async (_, headers) => {
      return headers as any;
    });

    const spyReturn = (await fetchQuery(
      { text: 'query' } as any,
      {},
      {}
    )) as any;

    expect(spyReturn['x-credentials']).toEqual(undefined);
  });
});
