import { AUTHORS, schemaComposer } from '../schemaComposer';
import { createAppSyncResolverHandler } from '../../src';
import { encodeCredentials } from '@ttoss/relay-amplify';
import { toGlobalId } from '@ttoss/graphql-api';

test('lambda handler should call author resolver correctly', async () => {
  const handler = createAppSyncResolverHandler({ schemaComposer });

  const author = AUTHORS[0];

  const event = {
    info: {
      parentTypeName: 'Query',
      fieldName: 'author',
    },
    arguments: {
      id: toGlobalId('Author', [author.pk, author.sk].join('##')),
    },
    source: {},
  } as any;

  const context = {} as any;

  const callback = jest.fn();

  const response = await handler(event, context, callback);

  expect(response).toEqual(author);
});

describe('testing headers', () => {
  const newSchemaComposer = schemaComposer.clone();

  const queryAuthorResolver = jest.fn();

  const resolver = newSchemaComposer.createResolver({
    name: 'author',
    resolve: queryAuthorResolver,
  });

  newSchemaComposer.Query.setField('author', resolver);

  const handler = createAppSyncResolverHandler({
    schemaComposer: newSchemaComposer,
  });

  const mockCredentials = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    sessionToken: 'sessionToken',
  };

  const headers = {
    header1: 'header1',
    header2: 'header2',
    header3: 'header3',
  };

  const event = {
    info: {
      parentTypeName: 'Query',
      fieldName: 'author',
    },
    request: {
      headers: {
        ...headers,
        'x-credentials': encodeCredentials(mockCredentials as any),
      },
    },
    source: {},
  } as any;

  const context = {} as any;

  const callback = jest.fn();

  test('should add credentials to context', async () => {
    await handler(event, context, callback);

    expect(queryAuthorResolver).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          credentials: mockCredentials,
        }),
      })
    );
  });

  test('should add headers to context', async () => {
    await handler(event, context, callback);

    expect(queryAuthorResolver).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          headers: expect.objectContaining(headers),
        }),
      })
    );
  });
});
