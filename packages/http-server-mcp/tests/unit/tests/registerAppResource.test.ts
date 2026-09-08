import { App, bodyParser } from '@ttoss/http-server';
import {
  createMcpRouter,
  McpServer,
  registerAppResource,
  registerToolFromSchema,
  UI_EXTENSION_ID,
  UI_RESOURCE_MIME_TYPE,
  z,
} from 'src/index';
import request from 'supertest';

const UI_URI = 'ui://weather-server/dashboard';
const HTML = '<!DOCTYPE html><html><body>dashboard</body></html>';

const mount = (server: McpServer) => {
  const app = new App();
  app.use(bodyParser());
  app.use(createMcpRouter(server).routes());
  return app.callback();
};

/** A 2025-era call — no per-request envelope. */
const legacy = (server: McpServer, method: string, params: unknown = {}) => {
  return request(mount(server))
    .post('/mcp')
    .send({ jsonrpc: '2.0', id: 1, method, params })
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json, text/event-stream');
};

/**
 * A `2026-07-28` call. Name-carrying methods must repeat the selector in the
 * `Mcp-Name` header, or the revision's own guard rejects the request before it
 * reaches a handler.
 */
const modern = (
  server: McpServer,
  method: string,
  params: Record<string, unknown> = {}
) => {
  const name = (params.name ?? params.uri) as string | undefined;
  return request(mount(server))
    .post('/mcp')
    .send({
      jsonrpc: '2.0',
      id: 1,
      method,
      params: {
        ...params,
        _meta: {
          'io.modelcontextprotocol/protocolVersion': '2026-07-28',
          'io.modelcontextprotocol/clientCapabilities': {
            extensions: {
              [UI_EXTENSION_ID]: { mimeTypes: [UI_RESOURCE_MIME_TYPE] },
            },
          },
        },
      },
    })
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json, text/event-stream')
    .set({
      'Mcp-Method': method,
      ...(name === undefined ? {} : { 'Mcp-Name': name }),
    });
};

const buildServer = () => {
  return new McpServer({ name: 'test-server', version: '1.0.0' });
};

describe('registerAppResource', () => {
  describe('constants', () => {
    test('exports the extension id and the app resource mime type', () => {
      expect(UI_EXTENSION_ID).toBe('io.modelcontextprotocol/ui');
      expect(UI_RESOURCE_MIME_TYPE).toBe('text/html;profile=mcp-app');
    });
  });

  describe('resource registration', () => {
    test('serves the HTML with the app mime type over resources/read', async () => {
      const server = buildServer();
      registerAppResource({
        server,
        name: 'weather_dashboard',
        uri: UI_URI,
        html: HTML,
      });

      const response = await legacy(server, 'resources/read', { uri: UI_URI });

      expect(response.status).toBe(200);
      expect(response.body.result.contents).toEqual([
        { uri: UI_URI, mimeType: UI_RESOURCE_MIME_TYPE, text: HTML },
      ]);
    });

    test('serves the same content on the 2026-07-28 revision', async () => {
      const server = buildServer();
      registerAppResource({
        server,
        name: 'weather_dashboard',
        uri: UI_URI,
        html: HTML,
      });

      const response = await modern(server, 'resources/read', { uri: UI_URI });

      expect(response.status).toBe(200);
      expect(response.body.result.contents[0]).toEqual({
        uri: UI_URI,
        mimeType: UI_RESOURCE_MIME_TYPE,
        text: HTML,
      });
    });

    test('relays _meta.ui on the read contents', async () => {
      const server = buildServer();
      registerAppResource({
        server,
        name: 'weather_dashboard',
        uri: UI_URI,
        html: HTML,
        ui: {
          csp: {
            connectDomains: ['https://api.openweathermap.org'],
            resourceDomains: ['https://cdn.jsdelivr.net'],
          },
          permissions: { geolocation: {} },
          domain: 'a904794854a047f6.claudemcpcontent.com',
          prefersBorder: true,
        },
      });

      const response = await legacy(server, 'resources/read', { uri: UI_URI });

      expect(response.body.result.contents[0]._meta).toEqual({
        ui: {
          csp: {
            connectDomains: ['https://api.openweathermap.org'],
            resourceDomains: ['https://cdn.jsdelivr.net'],
          },
          permissions: { geolocation: {} },
          domain: 'a904794854a047f6.claudemcpcontent.com',
          prefersBorder: true,
        },
      });
    });

    test('omits _meta from the read contents when no ui config is given', async () => {
      const server = buildServer();
      registerAppResource({
        server,
        name: 'weather_dashboard',
        uri: UI_URI,
        html: HTML,
      });

      const response = await legacy(server, 'resources/read', { uri: UI_URI });

      expect(response.body.result.contents[0]).not.toHaveProperty('_meta');
    });

    test('declares the resource on resources/list, carrying _meta.ui', async () => {
      const server = buildServer();
      registerAppResource({
        server,
        name: 'weather_dashboard',
        uri: UI_URI,
        description: 'Interactive weather dashboard view',
        html: HTML,
        ui: { prefersBorder: false },
      });

      const response = await legacy(server, 'resources/list');

      expect(response.body.result.resources).toEqual([
        {
          uri: UI_URI,
          name: 'weather_dashboard',
          description: 'Interactive weather dashboard view',
          mimeType: UI_RESOURCE_MIME_TYPE,
          _meta: { ui: { prefersBorder: false } },
        },
      ]);
    });

    test('builds the HTML per request when html is a function', async () => {
      const server = buildServer();
      const html = jest.fn(({ uri }: { uri: URL }) => {
        return `<!DOCTYPE html><html><body>${uri.href}</body></html>`;
      });
      registerAppResource({ server, name: 'dash', uri: UI_URI, html });

      const response = await legacy(server, 'resources/read', { uri: UI_URI });

      expect(response.body.result.contents[0].text).toContain(UI_URI);
      expect(html).toHaveBeenCalledWith({ uri: expect.any(URL) });
    });

    test('awaits an async html builder', async () => {
      const server = buildServer();
      registerAppResource({
        server,
        name: 'dash',
        uri: UI_URI,
        html: async () => {
          return HTML;
        },
      });

      const response = await legacy(server, 'resources/read', { uri: UI_URI });

      expect(response.body.result.contents[0].text).toBe(HTML);
    });

    test('returns the SDK resource handle, so it can be disabled', async () => {
      const server = buildServer();
      const app = registerAppResource({
        server,
        name: 'dash',
        uri: UI_URI,
        html: HTML,
      });

      app.resource.disable();

      const response = await legacy(server, 'resources/list');

      expect(response.body.result.resources).toEqual([]);
    });

    test.each([
      ['https://example.com/dashboard.html'],
      ['ui:/weather/dashboard'],
      ['dashboard'],
    ])('throws when the uri is not a ui:// URI (%s)', (uri) => {
      const server = buildServer();

      expect(() => {
        return registerAppResource({ server, name: 'dash', uri, html: HTML });
      }).toThrow(/ui:\/\//);
    });
  });

  describe('toolMeta', () => {
    test('carries the resource URI in both the current and deprecated keys', () => {
      const server = buildServer();
      const app = registerAppResource({
        server,
        name: 'dash',
        uri: UI_URI,
        html: HTML,
      });

      expect(app.toolMeta()).toEqual({
        ui: { resourceUri: UI_URI },
        'ui/resourceUri': UI_URI,
      });
    });

    test('includes visibility when given', () => {
      const server = buildServer();
      const app = registerAppResource({
        server,
        name: 'dash',
        uri: UI_URI,
        html: HTML,
      });

      expect(app.toolMeta({ visibility: ['app'] })).toEqual({
        ui: { resourceUri: UI_URI, visibility: ['app'] },
        'ui/resourceUri': UI_URI,
      });
    });

    test('merges extra _meta entries without letting them shadow the linkage', () => {
      const server = buildServer();
      const app = registerAppResource({
        server,
        name: 'dash',
        uri: UI_URI,
        html: HTML,
      });

      expect(app.toolMeta({ _meta: { 'dev.ttoss/audit': 'yes' } })).toEqual({
        'dev.ttoss/audit': 'yes',
        ui: { resourceUri: UI_URI },
        'ui/resourceUri': UI_URI,
      });
    });

    test('links a tool registered with registerTool, on both revisions', async () => {
      const server = buildServer();
      const app = registerAppResource({
        server,
        name: 'dash',
        uri: UI_URI,
        html: HTML,
      });
      server.registerTool(
        'get_weather',
        {
          description: 'Get the weather',
          inputSchema: { location: z.string() },
          _meta: app.toolMeta(),
        },
        async ({ location }) => {
          return { content: [{ type: 'text', text: location }] };
        }
      );

      const expected = {
        ui: { resourceUri: UI_URI },
        'ui/resourceUri': UI_URI,
      };

      expect(
        (await legacy(server, 'tools/list')).body.result.tools[0]._meta
      ).toEqual(expected);
      expect(
        (await modern(server, 'tools/list')).body.result.tools[0]._meta
      ).toEqual(expected);
    });

    test('links a tool registered with registerToolFromSchema', async () => {
      const server = buildServer();
      const app = registerAppResource({
        server,
        name: 'dash',
        uri: UI_URI,
        html: HTML,
      });
      registerToolFromSchema(server, {
        name: 'get_weather',
        description: 'Get the weather',
        _meta: app.toolMeta({ visibility: ['model', 'app'] }),
        handler: async () => {
          return { content: [{ type: 'text', text: 'sunny' }] };
        },
      });

      const response = await legacy(server, 'tools/list');

      expect(response.body.result.tools[0]._meta).toEqual({
        ui: { resourceUri: UI_URI, visibility: ['model', 'app'] },
        'ui/resourceUri': UI_URI,
      });
    });
  });
});
