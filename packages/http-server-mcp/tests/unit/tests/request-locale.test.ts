import { App, bodyParser } from '@ttoss/http-server';
import { createMcpRouter, getRequestLocale, McpServer } from 'src/index';
import request from 'supertest';

const MCP_ACCEPT = 'application/json, text/event-stream';

const callTool = async ({ acceptLanguage }: { acceptLanguage?: string }) => {
  let seen: string | undefined = 'not called';
  const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });

  mcpServer.registerTool(
    'locale',
    { description: 'Reports the request locale', inputSchema: {} },
    async () => {
      seen = getRequestLocale();
      return { content: [{ type: 'text', text: 'done' }] };
    }
  );

  const app = new App();
  app.use(bodyParser());
  app.use(createMcpRouter(mcpServer).routes());

  const post = (body: unknown) => {
    const req = request(app.callback())
      .post('/mcp')
      .send(body)
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT);
    return acceptLanguage ? req.set('Accept-Language', acceptLanguage) : req;
  };

  await post({
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' },
    },
    id: 1,
  });
  await post({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: { name: 'locale', arguments: {} },
    id: 2,
  });

  return seen;
};

test('a tool reads the MCP request Accept-Language, with no auth configured', async () => {
  expect(await callTool({ acceptLanguage: 'pt-BR,pt;q=0.9' })).toBe(
    'pt-BR,pt;q=0.9'
  );
});

test('without the header the locale is undefined', async () => {
  expect(await callTool({})).toBeUndefined();
});
