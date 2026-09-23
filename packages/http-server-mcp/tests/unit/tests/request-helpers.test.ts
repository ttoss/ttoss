import { App, bodyParser } from '@ttoss/http-server';
import {
  createMcpRouter,
  errorBodyMessage,
  getApiHeaders,
  McpServer,
} from 'src/index';
import request from 'supertest';

const MCP_ACCEPT = 'application/json, text/event-stream';

describe('errorBodyMessage', () => {
  test.each([
    [{ error: 'Not found' }, 'Not found'],
    [{ error: { code: 'E_GONE', message: 'Gone' } }, 'E_GONE: Gone'],
    [{ error: { message: 'Only message' } }, 'Only message'],
    [{ error: { code: 'ONLY_CODE' } }, 'ONLY_CODE'],
    [{ error: '' }, undefined],
    [{ message: 'no error key' }, undefined],
    ['plain text', undefined],
    [undefined, undefined],
  ])('renders %j as %j', (body, expected) => {
    expect(errorBodyMessage(body)).toBe(expected);
  });
});

describe('getApiHeaders', () => {
  test('returns an empty object outside an MCP request', () => {
    expect(getApiHeaders()).toEqual({});
  });

  test('returns the headers getApiHeaders produced for the current request', async () => {
    let seen: Record<string, string> | undefined;

    const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });
    mcpServer.registerTool(
      'whoami',
      { description: 'Echo headers', inputSchema: {} },
      async () => {
        seen = getApiHeaders();
        return { content: [{ type: 'text', text: 'ok' }] };
      }
    );

    const app = new App();
    app.use(bodyParser());
    app.use(
      createMcpRouter(mcpServer, {
        getApiHeaders: (ctx) => {
          return { Authorization: ctx.headers.authorization ?? '' };
        },
      }).routes()
    );

    await request(app.callback())
      .post('/mcp')
      .send({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
        id: 1,
      })
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT);

    await request(app.callback())
      .post('/mcp')
      .send({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name: 'whoami', arguments: {} },
        id: 2,
      })
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .set('Authorization', 'Bearer caller-token');

    expect(seen).toEqual({ Authorization: 'Bearer caller-token' });
  });
});
