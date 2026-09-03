import http from 'node:http';

import {
  Client,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client';
import { App, bodyParser } from '@ttoss/http-server';
import { createMcpRouter, McpServer } from 'src/index';

/**
 * The default `publicMethods` closes `tools/list`, which is only safe if an
 * OAuth client still finds its way into the authorization flow from the `401`.
 * Reasoning about that is what these tests replace: they drive the official
 * MCP client SDK — a real implementation of the spec's authorization flow —
 * against a real socket and assert it reaches `redirectToAuthorization`.
 */

jest.setTimeout(30000);

/** Minimal authorization server: only the metadata discovery needs. */
const startAuthorizationServer = () => {
  return new Promise<{ server: http.Server; port: number }>((resolve) => {
    const server = http.createServer((req, res) => {
      const { port } = server.address() as { port: number };
      const base = `http://127.0.0.1:${port}`;

      if (req.url?.startsWith('/.well-known/oauth-authorization-server')) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            issuer: base,
            authorization_endpoint: `${base}/authorize`,
            token_endpoint: `${base}/token`,
            registration_endpoint: `${base}/register`,
            response_types_supported: ['code'],
            grant_types_supported: ['authorization_code', 'refresh_token'],
            code_challenge_methods_supported: ['S256'],
          })
        );
        return;
      }

      if (req.url?.startsWith('/register')) {
        res.writeHead(201, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            client_id: 'test-client',
            redirect_uris: ['http://localhost/callback'],
          })
        );
        return;
      }

      res.writeHead(404);
      res.end('{}');
    });

    server.listen(0, () => {
      return resolve({
        server,
        port: (server.address() as { port: number }).port,
      });
    });
  });
};

/**
 * Binds the port before building the router: `createMcpRouter` reads
 * `resourceServerUrl` once at construction, so the real base URL has to exist
 * first or the protected-resource metadata routes are never registered.
 */
const startMcpServer = async ({
  authorizationServerPort,
  publicMethods,
}: {
  authorizationServerPort: number;
  publicMethods?: string[];
}) => {
  const server = http.createServer();
  await new Promise<void>((resolve) => {
    return server.listen(0, resolve);
  });
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;

  const mcpServer = new McpServer({ name: 'probe', version: '1.0.0' });
  mcpServer.registerTool(
    'secret-tool',
    { description: 'names an internal resource', inputSchema: {} },
    async () => {
      return { content: [{ type: 'text' as const, text: 'ok' }] };
    }
  );

  const app = new App();
  app.use(bodyParser());
  app.use(
    createMcpRouter(mcpServer, {
      auth: {
        verifyToken: () => {
          return Promise.reject(new Error('invalid'));
        },
        ...(publicMethods === undefined ? {} : { publicMethods }),
        resourceServerUrl: base,
        authorizationServerUrl: `http://127.0.0.1:${authorizationServerPort}`,
      },
    }).routes()
  );
  server.on('request', app.callback());

  return { server, base };
};

/** Records whether the client reached the authorization redirect. */
const recordingProvider = (authorizationUrls: string[]) => {
  return {
    get redirectUrl() {
      return 'http://localhost/callback';
    },
    get clientMetadata() {
      return {
        client_name: 'probe',
        redirect_uris: ['http://localhost/callback'],
        grant_types: ['authorization_code'],
        response_types: ['code'],
      };
    },
    clientInformation: () => {
      return undefined;
    },
    saveClientInformation: () => {},
    tokens: () => {
      return undefined;
    },
    saveTokens: () => {},
    redirectToAuthorization: (url: URL) => {
      authorizationUrls.push(`${url.origin}${url.pathname}`);
    },
    saveCodeVerifier: () => {},
  };
};

const connectOAuthClient = async (publicMethods?: string[]) => {
  const authorizationServer = await startAuthorizationServer();
  const { server, base } = await startMcpServer({
    authorizationServerPort: authorizationServer.port,
    publicMethods,
  });

  const authorizationUrls: string[] = [];
  const client = new Client({ name: 'probe-client', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(`${base}/mcp`), {
    authProvider: recordingProvider(
      authorizationUrls
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any,
  });

  let connectError: Error | undefined;
  try {
    await client.connect(transport);
  } catch (error) {
    connectError = error as Error;
  }

  try {
    await transport.close();
  } catch {
    /* the transport never opened when auth short-circuits the connect */
  }
  server.close();
  authorizationServer.server.close();

  return {
    authorizationUrls,
    connectError,
    authorizationServerPort: authorizationServer.port,
  };
};

describe('OAuth client flow under the default publicMethods', () => {
  test('the 401 challenge drives a real MCP client into the authorization flow', async () => {
    const { authorizationUrls, connectError, authorizationServerPort } =
      await connectOAuthClient();

    // Reaching the redirect is the whole point: the client resolved the
    // RFC 9728 challenge, read the protected-resource document this router
    // serves, discovered the authorization server, and registered.
    expect(authorizationUrls).toEqual([
      `http://127.0.0.1:${authorizationServerPort}/authorize`,
    ]);

    // `connect` rejecting is how the SDK says "finish the browser flow", not
    // a failure to start it.
    expect(connectError?.name).toBe('UnauthorizedError');
  });

  test('closing tools/list does not change how the flow starts', async () => {
    const closed = await connectOAuthClient();
    const open = await connectOAuthClient(['initialize', 'tools/list']);

    expect(closed.authorizationUrls).toHaveLength(1);
    expect(open.authorizationUrls).toHaveLength(1);
    expect(closed.connectError?.name).toBe(open.connectError?.name);
  });
});
