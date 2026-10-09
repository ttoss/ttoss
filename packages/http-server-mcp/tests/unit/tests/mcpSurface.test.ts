import {
  checkMcpSurface,
  DEFAULT_INSTRUCTIONS_LIMIT,
  findUnknownToolMentions,
  measureMcpSurface,
} from 'src/index';

const tool = (name: string, description = '') => {
  return {
    name,
    description,
    inputSchema: { type: 'object', properties: {} },
  };
};

const sizeOf = (t: ReturnType<typeof tool>) => {
  return JSON.stringify(t).length;
};

describe('measureMcpSurface', () => {
  test('sizes each tool as JSON, largest first, and sums them', () => {
    const small = tool('get-a');
    const large = tool('get-b', 'x'.repeat(100));

    expect(
      measureMcpSurface({ tools: [small, large], instructions: 'abc' })
    ).toEqual({
      total: sizeOf(small) + sizeOf(large),
      tools: [
        { name: 'get-b', size: sizeOf(large) },
        { name: 'get-a', size: sizeOf(small) },
      ],
      instructions: 3,
    });
  });

  test('counts absent instructions as zero', () => {
    expect(measureMcpSurface({ tools: [] })).toEqual({
      total: 0,
      tools: [],
      instructions: 0,
    });
  });
});

describe('checkMcpSurface', () => {
  test('answers nothing when every limit holds', () => {
    expect(
      checkMcpSurface({
        tools: [tool('get-a')],
        instructions: 'short',
        budget: { total: 10_000, perTool: 10_000 },
      })
    ).toEqual([]);
  });

  test('reports the total and each tool over its limit', () => {
    const big = tool('get-big', 'x'.repeat(200));

    expect(
      checkMcpSurface({
        tools: [tool('get-a'), big],
        budget: { total: 100, perTool: 150 },
      })
    ).toEqual([
      { kind: 'total', size: sizeOf(big) + sizeOf(tool('get-a')), limit: 100 },
      { kind: 'per_tool', name: 'get-big', size: sizeOf(big), limit: 150 },
    ]);
  });

  test('holds instructions to the client limit by default', () => {
    const instructions = 'x'.repeat(DEFAULT_INSTRUCTIONS_LIMIT + 1);

    expect(checkMcpSurface({ tools: [], instructions })).toEqual([
      {
        kind: 'instructions',
        size: DEFAULT_INSTRUCTIONS_LIMIT + 1,
        limit: DEFAULT_INSTRUCTIONS_LIMIT,
      },
    ]);
  });

  test('takes a different instructions limit', () => {
    expect(
      checkMcpSurface({
        tools: [],
        instructions: 'abcdef',
        budget: { instructions: 5 },
      })
    ).toEqual([{ kind: 'instructions', size: 6, limit: 5 }]);
  });
});

describe('findUnknownToolMentions', () => {
  test('answers the named tools the surface lacks, once each', () => {
    expect(
      findUnknownToolMentions({
        instructions:
          'Call `get-next`, then `list_tasks`. Never `get-recovery` or `get-recovery`; `blocks` is a field.',
        tools: [tool('get-next'), tool('list_tasks')],
      })
    ).toEqual(['get-recovery']);
  });

  test('takes a pattern for tools named another way', () => {
    expect(
      findUnknownToolMentions({
        instructions: 'Call [[getNext]] and [[listTasks]].',
        tools: [tool('getNext')],
        pattern: /\[\[(\w+)\]\]/g,
      })
    ).toEqual(['listTasks']);
  });
});
