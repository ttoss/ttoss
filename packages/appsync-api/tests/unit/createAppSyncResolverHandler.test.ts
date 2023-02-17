import { createAppSyncResolverHandler } from '../../src';
import { schemaComposer } from '../schemaComposer';

test('lambda handler should call resolver correctly', async () => {
  const handler = createAppSyncResolverHandler({ schemaComposer });

  const event = {
    info: {
      parentTypeName: 'Query',
      fieldName: 'authorById',
    },
    arguments: {
      id: '1234',
    },
    source: {},
  } as any;

  const context = {} as any;

  const callback = jest.fn();

  const response = await handler(event, context, callback);

  expect(response).toEqual({
    id: '1234',
    firstName: 'John',
    lastName: 'Doe',
  });
});
