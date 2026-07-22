import { openApiToToolDefinitions, type ToolDefinition } from 'src/index';

import { testSpec } from '../fixtures/openApiSpec';

const byName = (tools: ToolDefinition[], name: string): ToolDefinition => {
  const tool = tools.find((t) => {
    return t.name === name;
  });
  if (!tool) throw new Error(`tool ${name} not found`);
  return tool;
};

describe('openApiToToolDefinitions', () => {
  const tools = openApiToToolDefinitions({ spec: testSpec });

  test('derives one tool per translatable operation', () => {
    const names = tools
      .map((t) => {
        return t.name;
      })
      .sort();
    expect(names).toEqual([
      'create-actor',
      'create-agent',
      'delete-agent',
      'get-agent',
      'list-agents',
    ]);
  });

  test('skips operations without an operationId', () => {
    expect(
      tools.some((t) => {
        return t.pathTemplate === '/internal' && t.method === 'POST';
      })
    ).toBe(false);
  });

  test('skips unsupported HTTP methods (HEAD)', () => {
    expect(
      tools.some((t) => {
        return t.operationId === 'headAgent';
      })
    ).toBe(false);
  });

  test('skips operations flagged with the exclude extension', () => {
    expect(
      tools.some((t) => {
        return t.operationId === 'internalOp';
      })
    ).toBe(false);
  });

  test('kebab-cases the tool name and uppercases the method', () => {
    const tool = byName(tools, 'list-agents');
    expect(tool.method).toBe('GET');
    expect(tool.operationId).toBe('listAgents');
  });

  test('sanitises description: escapes quotes and flattens newlines', () => {
    const tool = byName(tools, 'list-agents');
    expect(tool.description).toBe(
      "List all agents. Supports filters.\\'quoted\\'"
    );
  });

  test('exposes operation extensions verbatim', () => {
    const tool = byName(tools, 'create-agent');
    expect(tool.extensions['x-iam-action']).toBe('agents:CreateAgent');
  });

  describe('path parameters', () => {
    test('camelCases path params and marks them required strings', () => {
      const tool = byName(tools, 'get-agent');
      expect(tool.inputSchema.properties).toEqual({
        agentId: { type: 'string', description: '' },
      });
      expect(tool.inputSchema.required).toEqual(['agentId']);
    });

    test('builds a path with the param URL-encoded', () => {
      const tool = byName(tools, 'get-agent');
      expect(tool.path({ agentId: 'agt/1' })).toBe('/agents/agt%2F1');
    });

    test('has no query or body builder', () => {
      const tool = byName(tools, 'get-agent');
      expect(tool.query).toBeUndefined();
      expect(tool.body).toBeUndefined();
    });
  });

  describe('query parameters', () => {
    const tool = byName(tools, 'list-agents');

    test('resolves a parameter $ref (ProjectId)', () => {
      expect(tool.inputSchema.properties).toHaveProperty('projectId');
      expect(tool.inputSchema.required).toEqual(
        expect.arrayContaining(['projectId', 'tags'])
      );
    });

    test('maps integer query type to number and keeps optional out of required', () => {
      const props = tool.inputSchema.properties as Record<
        string,
        { type: string; description?: string }
      >;
      expect(props.limit).toEqual({
        type: 'number',
        description: 'Max results',
      });
      expect(tool.inputSchema.required).not.toContain('limit');
    });

    test('models array query params with an items schema', () => {
      const props = tool.inputSchema.properties as Record<string, unknown>;
      expect(props.tags).toEqual({
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by tags',
      });
    });

    test('serialises the query string, repeating array values', () => {
      const qs = tool.query?.({
        projectId: 'prj_1',
        limit: 10,
        tags: ['a', 'b'],
      });
      expect(qs).toBe('?limit=10&tags=a&tags=b&project_id=prj_1');
    });

    test('omits undefined and null query values', () => {
      const qs = tool.query?.({ projectId: 'prj_1', limit: undefined });
      expect(qs).toBe('?project_id=prj_1');
    });
  });

  describe('request body', () => {
    const tool = byName(tools, 'create-agent');

    test('resolves a body $ref and camelCases properties', () => {
      const props = tool.inputSchema.properties as Record<string, unknown>;
      expect(Object.keys(props).sort()).toEqual([
        'modelConfig',
        'name',
        'skillIds',
      ]);
      expect(tool.inputSchema.required).toEqual(['name']);
    });

    test('hides server-managed fields from inputSchema but keeps them accepted', () => {
      const props = tool.inputSchema.properties as Record<string, unknown>;
      expect(props).not.toHaveProperty('id');
      expect(tool.acceptedBodyFields).toEqual(
        expect.arrayContaining(['name', 'model_config', 'skill_ids', 'id'])
      );
    });

    test('builds a snake_case body from camelCase args, dropping undefined', () => {
      const body = tool.body?.({
        name: 'Alpha',
        skillIds: ['s1'],
        modelConfig: undefined,
      });
      expect(body).toEqual({ name: 'Alpha', skill_ids: ['s1'] });
    });
  });

  describe('oneOf / anyOf body', () => {
    const tool = byName(tools, 'create-actor');

    test('merges alternatives: union of props, intersection of required', () => {
      const props = tool.inputSchema.properties as Record<string, unknown>;
      expect(Object.keys(props).sort()).toEqual(['agentId', 'chatId', 'name']);
      // `name` is required in both alternatives; agent_id/chat_id only in one.
      expect(tool.inputSchema.required).toEqual(['name']);
    });
  });

  describe('multiple specs and options', () => {
    test('flattens tools across an array of specs', () => {
      const all = openApiToToolDefinitions({ spec: [testSpec, testSpec] });
      expect(all).toHaveLength(tools.length * 2);
    });

    test('honours a custom exclude extension', () => {
      const custom = openApiToToolDefinitions({
        spec: {
          paths: {
            '/x': {
              get: { operationId: 'getX', 'x-hide': true },
              post: { operationId: 'postX' },
            },
          },
        },
        options: { excludeExtension: 'x-hide' },
      });
      expect(
        custom.map((t) => {
          return t.name;
        })
      ).toEqual(['post-x']);
    });

    test('empty schema for an operation with no params', () => {
      const [tool] = openApiToToolDefinitions({
        spec: { paths: { '/ping': { get: { operationId: 'ping' } } } },
      });
      expect(tool.inputSchema).toEqual({ type: 'object' });
    });

    test('handles a spec with no paths', () => {
      expect(openApiToToolDefinitions({ spec: {} })).toEqual([]);
    });
  });
});
