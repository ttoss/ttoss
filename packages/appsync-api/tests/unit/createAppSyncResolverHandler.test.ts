/* eslint-disable @typescript-eslint/no-explicit-any */
import { AUTHORS, schemaComposer } from '../schemaComposer';
import { allow, deny, shield } from 'graphql-shield';
import { createAppSyncResolverHandler } from '../../src';
import { encode } from '@ttoss/auth-core';
import { toGlobalId } from '@ttoss/graphql-api';

test.each([
  {
    sort: undefined,
    expected: ['Amanda', 'Bob', 'Charlie', 'David', 'Eve'],
  },
  {
    sort: 'SK_ASC',
    expected: ['Amanda', 'Bob', 'Charlie', 'David', 'Eve'],
  },
  {
    sort: 'SK_DESC',
    expected: ['Eve', 'David', 'Charlie', 'Bob', 'Amanda'],
  },
])('should return enum values as args', async ({ sort, expected }) => {
  const handler = createAppSyncResolverHandler({ schemaComposer });

  const event = {
    info: {
      parentTypeName: 'Query',
      fieldName: 'authors',
    },
    arguments: { sort },
    source: {},
  } as any;

  const context = {} as any;

  const callback = jest.fn();

  const response = await handler(event, context, callback);

  const skOrder = response.edges.map((edge: any) => {
    return edge.node.sk;
  });

  expect(skOrder).toEqual(expected);
});

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

describe('testing middlewares', () => {
  const permissionError = new Error('Test Not allowed');
  permissionError.name = 'NotAllowed';

  test.each([
    shield(
      {
        Query: {
          '*': deny,
        },
      },
      {
        fallbackRule: deny,
        fallbackError: permissionError,
      }
    ),
    shield(
      {
        Query: {
          '*': deny,
        },
      },
      {
        fallbackRule: allow,
        fallbackError: permissionError,
      }
    ),
    shield(
      {
        Query: {
          author: deny,
        },
      },
      {
        fallbackRule: allow,
        fallbackError: permissionError,
      }
    ),
  ])('should NOT query author %#', async (permissions) => {
    const handler = createAppSyncResolverHandler({
      schemaComposer,
      middlewares: [permissions],
    });

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

    let error;

    try {
      await handler(event, context, callback);
    } catch (err) {
      error = err;
    } finally {
      expect(error).toEqual(permissionError);
    }
  });

  test.each([
    shield(
      {
        Query: {
          author: allow,
        },
      },
      {
        fallbackRule: allow,
      }
    ),
    shield({
      Query: {
        author: allow,
      },
    }),
    shield(
      {
        Query: {
          '*': deny,
          author: allow,
        },
        Author: {
          id: allow,
          name: allow,
        },
      },
      {
        fallbackRule: deny,
      }
    ),
    shield(
      {
        Query: {
          '*': deny,
          author: allow,
        },
        Author: {
          '*': allow,
        },
      },
      {
        fallbackRule: deny,
      }
    ),
  ])('should query author %#', async (permissions) => {
    const handler = createAppSyncResolverHandler({
      schemaComposer,
      middlewares: [permissions],
    });

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
});

describe('testing headers', () => {
  const newSchemaComposer = schemaComposer.clone();

  const queryAuthorResolver = jest.fn();

  const resolver = newSchemaComposer.createResolver({
    name: 'mockedAuthor',
    type: `type MockedAuthor { id: ID! name: String! }`,
    resolve: queryAuthorResolver,
  });

  newSchemaComposer.Query.addFields({ mockedAuthor: resolver });

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
      fieldName: 'mockedAuthor',
    },
    request: {
      headers: {
        ...headers,
        'x-credentials': encode(mockCredentials as any),
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
