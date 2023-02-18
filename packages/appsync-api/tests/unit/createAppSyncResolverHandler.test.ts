import { AUTHORS, schemaComposer } from '../schemaComposer';
import { createAppSyncResolverHandler, toGlobalId } from '../../src';

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
