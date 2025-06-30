import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { query } from 'src/query';

const lambdaMock = mockClient(LambdaClient);

beforeEach(() => {
  lambdaMock.reset();
});

/**
 * Mock console.error to prevent logs during tests.
 */
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

test('should accept string or object as parameters', async () => {
  const text = 'SELECT * FROM table';

  lambdaMock
    .on(InvokeCommand, {
      Payload: JSON.stringify({ readOnly: true, text }),
    })
    .resolves({
      Payload: new TextEncoder().encode(
        JSON.stringify({
          rows: [{ id: 1 }],
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any,
    });

  const result1 = await query(text);
  const result2 = await query({ text });

  expect(result1.rows).toEqual([{ id: 1 }]);
  expect(result2.rows).toEqual([{ id: 1 }]);
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

test('should decode special characters', async () => {
  const textWithSpecialCharacters = 'special characters: áéíóúñ';

  lambdaMock.on(InvokeCommand).resolves({
    Payload: new TextEncoder().encode(
      JSON.stringify({
        rows: [
          {
            text: textWithSpecialCharacters,
          },
        ],
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any,
  });

  const result = await query('SELECT * FROM table');

  expect(result.rows).toEqual([
    {
      text: textWithSpecialCharacters,
    },
  ]);
});

test('should not add camelCaseKeys to the rows', async () => {
  lambdaMock.on(InvokeCommand).resolves({
    Payload: new TextEncoder().encode(
      JSON.stringify({
        rows: [{ snake_case: 'value', obj_nested: { snake_case: 'value' } }],
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any,
  });

  const result = await query({
    text: 'SELECT * FROM table',
    camelCaseKeys: false,
  });

  expect(result.rows).toEqual([
    {
      snake_case: 'value',
      obj_nested: { snake_case: 'value' },
    },
  ]);
});

test('should throw error.message', async () => {
  const text = 'SELECT * FROM table';

  const errorMessage = 'error message';

  lambdaMock
    .on(InvokeCommand, {
      Payload: JSON.stringify({ readOnly: true, text }),
    })
    .resolves({
      Payload: new TextEncoder().encode(
        JSON.stringify({
          errorType: 'Error',
          errorMessage,
          trace: ['trace'],
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any,
    });

  await expect(query(text)).rejects.toThrow(errorMessage);
});
