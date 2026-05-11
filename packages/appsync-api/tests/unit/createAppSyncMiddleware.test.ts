/* eslint-disable @typescript-eslint/no-explicit-any */
import { toGlobalId } from '@ttoss/ids';

import {
  createAppSyncMiddleware,
  createAppSyncResolverHandler,
} from '../../src';
import { AUTHORS, schemaComposer } from '../schemaComposer';

describe('createAppSyncMiddleware', () => {
  test('middleware is invoked with AppSync-style info object', async () => {
    const middlewareFn = jest.fn(
      async (resolve, source, args, context, info) => {
        return resolve(source, args, context, info);
      }
    );

    const middleware = createAppSyncMiddleware(middlewareFn);

    const handler = createAppSyncResolverHandler({
      schemaComposer,
      middlewares: [middleware],
    });

    const author = AUTHORS[0];

    const event = {
      info: {
        parentTypeName: 'Query',
        fieldName: 'author',
        variables: {},
        selectionSetList: ['id', 'name'],
        selectionSetGraphQL: '{ id name }',
      },
      arguments: {
        id: toGlobalId('Author', [author.pk, author.sk].join('##')),
      },
      source: {},
    } as any;

    await handler(event, {} as any, jest.fn());

    expect(middlewareFn).toHaveBeenCalledWith(
      expect.any(Function),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        fieldName: 'author',
        parentTypeName: 'Query',
      })
    );
  });

  test('middleware can read AppSync info fields without casting', async () => {
    const capturedInfo: { fieldName: string; parentTypeName: string } = {
      fieldName: '',
      parentTypeName: '',
    };

    const middleware = createAppSyncMiddleware(
      async (resolve, source, args, context, info) => {
        capturedInfo.fieldName = info.fieldName;
        capturedInfo.parentTypeName = info.parentTypeName;
        return resolve(source, args, context, info);
      }
    );

    const handler = createAppSyncResolverHandler({
      schemaComposer,
      middlewares: [middleware],
    });

    const author = AUTHORS[0];

    const event = {
      info: {
        parentTypeName: 'Query',
        fieldName: 'author',
        variables: {},
        selectionSetList: [],
        selectionSetGraphQL: '',
      },
      arguments: {
        id: toGlobalId('Author', [author.pk, author.sk].join('##')),
      },
      source: {},
    } as any;

    await handler(event, {} as any, jest.fn());

    expect(capturedInfo.fieldName).toBe('author');
    expect(capturedInfo.parentTypeName).toBe('Query');
  });

  test('middleware can intercept and modify the result', async () => {
    const middleware = createAppSyncMiddleware(
      async (resolve, source, args, context, info) => {
        const result = await resolve(source, args, context, info);
        return { ...result, middlewareApplied: true };
      }
    );

    const handler = createAppSyncResolverHandler({
      schemaComposer,
      middlewares: [middleware],
    });

    const author = AUTHORS[0];

    const event = {
      info: {
        parentTypeName: 'Query',
        fieldName: 'author',
        variables: {},
        selectionSetList: [],
        selectionSetGraphQL: '',
      },
      arguments: {
        id: toGlobalId('Author', [author.pk, author.sk].join('##')),
      },
      source: {},
    } as any;

    const result = await handler(event, {} as any, jest.fn());

    expect(result).toMatchObject({ ...author, middlewareApplied: true });
  });
});
