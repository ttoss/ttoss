/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock('aws-amplify');

import * as API from 'aws-amplify/api';
import * as Auth from 'aws-amplify/auth';
import {
  createEnvironment,
  decodeCredentials,
  encodeCredentials,
  fetchQuery,
} from 'src/index';

const mockCredentials = {
  accessKeyId: 'accessKeyId',
  secretAccessKey: 'secretAccessKey',
  sessionToken: 'sessionToken',
  identityId: 'identityId',
  authenticated: true,
};

const mockAuthSessionResponse = {
  credentials: {
    accessKeyId: 'accessKeyId',
    sessionToken: 'sessionToken',
    secretAccessKey: 'secretAccessKey',
    expiration: new Date(),
  },
  identityId: 'identityId',
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
    jest
      .spyOn(Auth, 'fetchAuthSession')
      .mockResolvedValue(mockAuthSessionResponse);

    jest.spyOn(API, 'post').mockImplementation(() => {
      const headers: Record<string, string> = {};

      const credentials = encodeCredentials(mockCredentials);

      headers['x-credentials'] = credentials;

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
      .spyOn(Auth, 'fetchAuthSession')
      .mockRejectedValue(new Error('No credentials'));

    jest.spyOn(API, 'post').mockImplementation(() => {
      const headers: Record<string, string> = {};

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
