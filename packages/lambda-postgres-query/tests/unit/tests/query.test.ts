import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { query } from 'src/query';

const lambdaMock = mockClient(LambdaClient);

beforeEach(() => {
  lambdaMock.reset();
});

test('should add camelCaseKeys to the rows', async () => {
  lambdaMock.on(InvokeCommand).resolves({
    Payload: new TextEncoder().encode(
      JSON.stringify({
        rows: [{ snake_case: 'value', obj_nested: { snake_case: 'value' } }],
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any,
  });

  const result = await query('SELECT * FROM table');

  expect(result.rows).toEqual([
    {
      snakeCase: 'value',
      snake_case: 'value',
      objNested: { snakeCase: 'value' },
      obj_nested: { snake_case: 'value' },
    },
  ]);
});
