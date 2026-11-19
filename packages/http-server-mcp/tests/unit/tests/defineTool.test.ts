import { defineTool, withNotes, z } from 'src/index';

type ToolCallResult = {
  isError?: true;
  content: Array<{ type: string; text: string }>;
  structuredContent?: unknown;
};

const call = async ({
  method,
  withOutputSchema = false,
}: {
  method: (args: Record<string, unknown>) => unknown;
  withOutputSchema?: boolean;
}) => {
  const tool = defineTool({
    name: 'get-report',
    description: 'Get a report.',
    ...(withOutputSchema
      ? { outputSchema: z.object({ total: z.number() }) }
      : {}),
    method,
  });

  return (await tool.handler({})) as ToolCallResult;
};

describe('defineTool', () => {
  test('answers plain data as one JSON text block', async () => {
    const result = await call({
      method: () => {
        return { total: 3 };
      },
    });

    expect(result).toEqual({
      content: [{ type: 'text', text: '{"total":3}' }],
    });
  });

  test('answers a null result with the not-found error', async () => {
    const result = await call({
      method: () => {
        return null;
      },
    });

    expect(result.isError).toBe(true);
    expect(JSON.parse(result.content[0].text)).toEqual({ error: 'Not found' });
  });
});

describe('withNotes', () => {
  test('adds each note as its own text block after the data', async () => {
    const result = await call({
      method: async () => {
        return withNotes({
          data: { total: 3 },
          notes: ['Only the last 7 days are available.', 'Second note.'],
        });
      },
    });

    expect(result.content).toEqual([
      { type: 'text', text: '{"total":3}' },
      { type: 'text', text: 'Only the last 7 days are available.' },
      { type: 'text', text: 'Second note.' },
    ]);
  });

  test('keeps structuredContent to the data alone, so the outputSchema describes it', async () => {
    const result = await call({
      withOutputSchema: true,
      method: () => {
        return withNotes({ data: { total: 3 }, notes: ['A note.'] });
      },
    });

    expect(result.structuredContent).toEqual({ total: 3 });
    expect(result.content).toHaveLength(2);
  });

  test('drops empty notes', async () => {
    const result = await call({
      method: () => {
        return withNotes({ data: { total: 3 }, notes: ['', '   '] });
      },
    });

    expect(result.content).toEqual([{ type: 'text', text: '{"total":3}' }]);
  });

  test('answers null data with the not-found error and no note', async () => {
    const result = await call({
      method: () => {
        return withNotes({ data: null, notes: ['A note.'] });
      },
    });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
  });

  test('treats an object that only looks like a wrapped result as plain data', async () => {
    const result = await call({
      method: () => {
        return { data: { total: 3 }, notes: ['not a note'] };
      },
    });

    expect(result.content).toEqual([
      {
        type: 'text',
        text: '{"data":{"total":3},"notes":["not a note"]}',
      },
    ]);
  });
});
