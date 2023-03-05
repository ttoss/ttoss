import { AUTHORS, schemaComposer } from '../schemaComposer';
import { createAppSyncResolverHandler, toGlobalId } from '../../src';
import { encodeCredentials } from '@ttoss/relay-amplify';

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

test('should add credentials to context', async () => {
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

  const event = {
    info: {
      parentTypeName: 'Query',
      fieldName: 'author',
    },
    request: {
      headers: {
        'x-credentials': encodeCredentials(mockCredentials as any),
      },
    },
    source: {},
  } as any;

  const context = {} as any;

  const callback = jest.fn();

  await handler(event, context, callback);

  expect(queryAuthorResolver).toHaveBeenCalledWith(
    expect.objectContaining({
      context: expect.objectContaining({
        credentials: mockCredentials,
      }),
    })
  );
});
