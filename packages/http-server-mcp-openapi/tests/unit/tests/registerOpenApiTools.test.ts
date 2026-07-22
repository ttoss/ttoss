import { App, bodyParser } from '@ttoss/http-server';
import { createMcpRouter, McpServer } from '@ttoss/http-server-mcp';
import { registerOpenApiTools, type ResolvedRequest } from 'src/index';
import request from 'supertest';

import { testSpec } from '../fixtures/openApiSpec';

const sendMcpRequest = (
  app: ReturnType<typeof App.prototype.callback>,
  body: Record<string, unknown>
) => {
  return request(app)
    .post('/mcp')
    .send(body)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json, text/event-stream');
};

/** Parse the JSON-RPC result out of an MCP HTTP response (JSON or SSE). */
const parseRpc = (res: request.Response): Record<string, unknown> => {
  if (typeof res.body === 'object' && res.body?.result) return res.body.result;
  const text: string = res.text || '';
  const line = text.split('\n').find((l) => {
    return l.startsWith('data:');
  });
  const json = line ? line.replace(/^data:\s*/, '') : text;
  return JSON.parse(json).result;
};

const buildApp = (calls: ResolvedRequest[]) => {
  const server = new McpServer({ name: 'test', version: '1.0.0' });
  const tools = registerOpenApiTools({
    server,
    spec: testSpec,
    callApi: (req) => {
      calls.push(req);
      return { ok: true, url: req.url };
    },
  });
  const app = new App();
  app.use(bodyParser());
  const router = createMcpRouter(server);
  app.use(router.routes());
  app.use(router.allowedMethods());
  return { app: app.callback(), tools };
};

describe('registerOpenApitools', () => {
  test('returns the registered tool definitions', () => {
    const { tools } = buildApp([]);
    expect(
      tools.map((t) => {
        return t.name;
      })
    ).toContain('create-agent');
  });

  test('lists every derived tool over the MCP wire with its JSON Schema', async () => {
    const { app } = buildApp([]);
    const res = await sendMcpRequest(app, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    });
    expect(res.status).toBe(200);
    const result = parseRpc(res);
    const list = result.tools as Array<{
      name: string;
      inputSchema: Record<string, unknown>;
    }>;
    const names = list
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
    const getAgent = list.find((t) => {
      return t.name === 'get-agent';
    })!;
    // Verbatim JSON Schema (not Zod-derived) is forwarded to clients.
    expect(getAgent.inputSchema.properties).toEqual({
      agentId: { type: 'string', description: '' },
    });
  });

  test('resolves a GET tool call into a method/url and returns the payload', async () => {
    const calls: ResolvedRequest[] = [];
    const { app } = buildApp(calls);
    const res = await sendMcpRequest(app, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'get-agent', arguments: { agentId: 'agt_1' } },
    });
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe('/agents/agt_1');
    expect(calls[0].body).toBeUndefined();
    expect(calls[0].tool.operationId).toBe('getAgent');

    const result = parseRpc(res);
    const content = result.content as Array<{ type: string; text: string }>;
    expect(JSON.parse(content[0].text)).toEqual({
      ok: true,
      url: '/agents/agt_1',
    });
  });

  test('resolves a POST tool call into a snake_case body', async () => {
    const calls: ResolvedRequest[] = [];
    const { app } = buildApp(calls);
    await sendMcpRequest(app, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'create-agent',
        arguments: { name: 'Alpha', skillIds: ['s1'] },
      },
    });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('/agents');
    expect(calls[0].body).toEqual({ name: 'Alpha', skill_ids: ['s1'] });
  });

  test('builds a query string for a list tool call', async () => {
    const calls: ResolvedRequest[] = [];
    const { app } = buildApp(calls);
    await sendMcpRequest(app, {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'list-agents',
        arguments: { projectId: 'prj_1', tags: ['x'] },
      },
    });
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe('/agents?tags=x&project_id=prj_1');
  });

  test('custom toText controls the text payload; string data passes through', async () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    registerOpenApiTools({
      server,
      spec: testSpec,
      callApi: () => {
        return 'raw-string';
      },
      toText: (data) => {
        return `wrapped:${String(data)}`;
      },
    });
    const app = new App();
    app.use(bodyParser());
    const router = createMcpRouter(server);
    app.use(router.routes());
    const res = await sendMcpRequest(app.callback(), {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: { name: 'get-agent', arguments: { agentId: 'a' } },
    });
    const result = parseRpc(res);
    const content = result.content as Array<{ text: string }>;
    expect(content[0].text).toBe('wrapped:raw-string');
  });

  test('default toText returns a string payload verbatim', async () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    registerOpenApiTools({
      server,
      spec: testSpec,
      callApi: () => {
        return 'plain';
      },
    });
    const app = new App();
    app.use(bodyParser());
    const router = createMcpRouter(server);
    app.use(router.routes());
    const res = await sendMcpRequest(app.callback(), {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: { name: 'get-agent', arguments: { agentId: 'a' } },
    });
    const result = parseRpc(res);
    const content = result.content as Array<{ text: string }>;
    expect(content[0].text).toBe('plain');
  });
});
