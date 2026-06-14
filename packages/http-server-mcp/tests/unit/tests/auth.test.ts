import { CognitoJwtVerifier } from '@ttoss/auth-core/amazon-cognito';
import { App, bodyParser } from '@ttoss/http-server';
import {
  checkScopes,
  createMcpRouter,
  getIdentity,
  McpServer,
  z,
} from 'src/index';
import request from 'supertest';

jest.mock('@ttoss/auth-core/amazon-cognito', () => {
  return {
    CognitoJwtVerifier: {
      create: jest.fn(),
    },
  };
});

const MCP_ACCEPT = 'application/json, text/event-stream';

const makeMcpRequest = (method: string, params: unknown, id: number) => {
  return {
    jsonrpc: '2.0',
    method,
    params,
    id,
  };
};

const initializeParams = {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'test-client', version: '1.0.0' },
};

describe('auth — no config', () => {
  test('requests pass through when auth is not configured', async () => {
    const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });
    const app = new App();
    app.use(bodyParser());
    app.use(createMcpRouter(mcpServer).routes());

    const res = await request(app.callback())
      .post('/mcp')
      .send(makeMcpRequest('initialize', initializeParams, 1))
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT);

    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});

describe('auth — verifyToken', () => {
  const buildApp = (
    verifyToken: (token: string) => Promise<unknown>,
    requiredScopes?: string[]
  ) => {
    const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });

    mcpServer.registerTool(
      'whoami',
      { description: 'Returns identity', inputSchema: {} },
      async () => {
        const identity = getIdentity();
        return {
          content: [{ type: 'text', text: JSON.stringify(identity) }],
        };
      }
    );

    mcpServer.registerTool(
      'admin-only',
      { description: 'Requires admin scope', inputSchema: { x: z.string() } },
      async () => {
        checkScopes(['admin']);
        return { content: [{ type: 'text', text: 'ok' }] };
      }
    );

    const app = new App();
    app.use(bodyParser());
    app.use(
      createMcpRouter(mcpServer, {
        auth: { verifyToken, requiredScopes },
      }).routes()
    );
    return app;
  };

  test('returns 401 when no Authorization header is sent', async () => {
    const app = buildApp(() => {
      return Promise.reject(new Error('invalid'));
    });

    const res = await request(app.callback())
      .post('/mcp')
      .send(makeMcpRequest('tools/call', { name: 'whoami', arguments: {} }, 1))
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT);

    expect(res.status).toBe(401);
    expect(res.headers['www-authenticate']).toBe('Bearer');
  });

  test('returns 401 when verifyToken rejects', async () => {
    const app = buildApp(() => {
      return Promise.reject(new Error('bad token'));
    });

    const res = await request(app.callback())
      .post('/mcp')
      .send(makeMcpRequest('tools/call', { name: 'whoami', arguments: {} }, 1))
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .set('Authorization', 'Bearer bad-token');

    expect(res.status).toBe(401);
    expect(res.headers['www-authenticate']).toBe('Bearer');
  });

  test('allows request and sets identity when verifyToken resolves', async () => {
    const payload = { sub: 'user-123', scope: 'openid' };
    const app = buildApp(() => {
      return Promise.resolve(payload);
    });

    const initRes = await request(app.callback())
      .post('/mcp')
      .send(makeMcpRequest('initialize', initializeParams, 1))
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .set('Authorization', 'Bearer valid-token');

    expect(initRes.status).toBe(200);
  });

  test('getIdentity() returns verified payload inside tool handler', async () => {
    const payload = { sub: 'user-abc', email: 'user@example.com' };
    const app = buildApp(() => {
      return Promise.resolve(payload);
    });

    const callback = app.callback();

    await request(callback)
      .post('/mcp')
      .send(makeMcpRequest('initialize', initializeParams, 1))
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .set('Authorization', 'Bearer tok');

    const toolRes = await request(callback)
      .post('/mcp')
      .send(makeMcpRequest('tools/call', { name: 'whoami', arguments: {} }, 2))
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .set('Authorization', 'Bearer tok');

    expect(toolRes.status).toBe(200);
    const body = toolRes.body;
    const text = body?.result?.content?.[0]?.text;
    expect(JSON.parse(text)).toEqual(payload);
  });

  test('returns 403 when requiredScopes are not satisfied', async () => {
    const payload = { sub: 'u1', scope: 'openid profile' };
    const app = buildApp(() => {
      return Promise.resolve(payload);
    }, ['mcp:access']);

    const res = await request(app.callback())
      .post('/mcp')
      .send(makeMcpRequest('tools/call', { name: 'whoami', arguments: {} }, 1))
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .set('Authorization', 'Bearer tok');

    expect(res.status).toBe(403);
  });

  test('returns 403 when the token carries no scope claim at all', async () => {
    const app = buildApp(() => {
      return Promise.resolve({ sub: 'u1' }); // no `scope` property
    }, ['mcp:access']);

    const res = await request(app.callback())
      .post('/mcp')
      .send(makeMcpRequest('tools/call', { name: 'whoami', arguments: {} }, 1))
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .set('Authorization', 'Bearer tok');

    expect(res.status).toBe(403);
  });

  test('allows request when requiredScopes are satisfied', async () => {
    const payload = { sub: 'u1', scope: 'openid mcp:access profile' };
    const app = buildApp(() => {
      return Promise.resolve(payload);
    }, ['mcp:access']);

    const callback = app.callback();

    await request(callback)
      .post('/mcp')
      .send(makeMcpRequest('initialize', initializeParams, 1))
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .set('Authorization', 'Bearer tok');

    const res = await request(callback)
      .post('/mcp')
      .send(makeMcpRequest('tools/call', { name: 'whoami', arguments: {} }, 2))
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .set('Authorization', 'Bearer tok');

    expect(res.status).toBe(200);
  });

  test('checkScopes() throws when scope is missing from token', async () => {
    const payload = { sub: 'u1', scope: 'openid' };
    const app = buildApp(() => {
      return Promise.resolve(payload);
    });

    const callback = app.callback();

    await request(callback)
      .post('/mcp')
      .send(makeMcpRequest('initialize', initializeParams, 1))
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .set('Authorization', 'Bearer tok');

    const toolRes = await request(callback)
      .post('/mcp')
      .send(
        makeMcpRequest(
          'tools/call',
          { name: 'admin-only', arguments: { x: 'y' } },
          2
        )
      )
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .set('Authorization', 'Bearer tok');

    // MCP SDK returns 200 but marks it as an error
    expect(toolRes.status).toBe(200);
    expect(toolRes.body?.result?.isError).toBe(true);
    expect(toolRes.body?.result?.content?.[0]?.text).toContain(
      'Insufficient scopes'
    );
  });

  test('checkScopes() passes when all scopes are present', async () => {
    const payload = { sub: 'u1', scope: 'openid admin write:users' };
    const app = buildApp(() => {
      return Promise.resolve(payload);
    });

    const callback = app.callback();

    await request(callback)
      .post('/mcp')
      .send(makeMcpRequest('initialize', initializeParams, 1))
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .set('Authorization', 'Bearer tok');

    const toolRes = await request(callback)
      .post('/mcp')
      .send(
        makeMcpRequest(
          'tools/call',
          { name: 'admin-only', arguments: { x: 'y' } },
          2
        )
      )
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .set('Authorization', 'Bearer tok');

    expect(toolRes.status).toBe(200);
    expect(toolRes.body?.result?.isError).toBeFalsy();
  });

  test('throws at startup when neither cognitoUserPool nor verifyToken is provided', () => {
    const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });
    expect(() => {
      createMcpRouter(mcpServer, { auth: {} });
    }).toThrow(
      'OAuthVerifyOptions requires either cognitoUserPool or verifyToken'
    );
  });
});

describe('auth — public methods and RFC 9728 discovery', () => {
  const buildApp = (authOverrides: {
    publicMethods?: string[];
    resourceMetadataUrl?: string;
  }) => {
    const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });
    mcpServer.registerTool(
      'whoami',
      { description: 'Returns identity', inputSchema: {} },
      async () => {
        return { content: [{ type: 'text', text: 'ok' }] };
      }
    );

    const app = new App();
    app.use(bodyParser());
    app.use(
      createMcpRouter(mcpServer, {
        auth: {
          // Always rejects so any verified path returns 401.
          verifyToken: () => {
            return Promise.reject(new Error('invalid'));
          },
          ...authOverrides,
        },
      }).routes()
    );
    return app;
  };

  const post = (app: ReturnType<typeof buildApp>, method: string) => {
    return request(app.callback())
      .post('/mcp')
      .send(makeMcpRequest(method, initializeParams, 1))
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT);
  };

  test('initialize is public by default (no token required)', async () => {
    const res = await post(buildApp({}), 'initialize');
    expect(res.status).not.toBe(401);
  });

  test('tools/list is public by default (no token required)', async () => {
    const res = await post(buildApp({}), 'tools/list');
    expect(res.status).not.toBe(401);
  });

  test('protected methods still require a token by default', async () => {
    const res = await post(buildApp({}), 'tools/call');
    expect(res.status).toBe(401);
  });

  test('publicMethods overrides the default set', async () => {
    const app = buildApp({ publicMethods: ['ping'] });

    // 'ping' now bypasses verification...
    const pingRes = await post(app, 'ping');
    expect(pingRes.status).not.toBe(401);

    // ...while 'initialize' is no longer public.
    const initRes = await post(app, 'initialize');
    expect(initRes.status).toBe(401);
  });

  test('empty publicMethods requires a token for every method', async () => {
    const res = await post(buildApp({ publicMethods: [] }), 'initialize');
    expect(res.status).toBe(401);
  });

  test('a request without a method is treated as protected', async () => {
    const res = await request(buildApp({}).callback())
      .post('/mcp')
      .send({ jsonrpc: '2.0', id: 1 })
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT);

    expect(res.status).toBe(401);
  });

  test('401 emits RFC 9728 header when resourceMetadataUrl is set', async () => {
    const app = buildApp({
      resourceMetadataUrl:
        'https://mcp.example.com/.well-known/oauth-protected-resource',
    });
    const res = await post(app, 'tools/call');

    expect(res.status).toBe(401);
    expect(res.headers['www-authenticate']).toBe(
      'Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource"'
    );
  });

  test('401 falls back to bare Bearer when resourceMetadataUrl is omitted', async () => {
    const res = await post(buildApp({}), 'tools/call');
    expect(res.status).toBe(401);
    expect(res.headers['www-authenticate']).toBe('Bearer');
  });
});

describe('auth — OAuth Protected Resource metadata endpoint', () => {
  test('serves /.well-known/oauth-protected-resource when configured', async () => {
    const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });
    const app = new App();
    app.use(bodyParser());
    app.use(
      createMcpRouter(mcpServer, {
        auth: {
          verifyToken: () => {
            return Promise.resolve({ sub: 'u' });
          },
          resourceServerUrl: 'https://mcp.example.com',
          authorizationServerUrl: 'https://auth.example.com',
        },
      }).routes()
    );

    const res = await request(app.callback()).get(
      '/.well-known/oauth-protected-resource'
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      resource: 'https://mcp.example.com',
      authorization_servers: ['https://auth.example.com'],
    });
  });

  test('does not serve metadata endpoint when urls are not configured', async () => {
    const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });
    const app = new App();
    app.use(bodyParser());
    app.use(
      createMcpRouter(mcpServer, {
        auth: {
          verifyToken: () => {
            return Promise.resolve({ sub: 'u' });
          },
        },
      }).routes()
    );

    const res = await request(app.callback()).get(
      '/.well-known/oauth-protected-resource'
    );

    expect(res.status).toBe(404);
  });
});

describe('auth — cognitoUserPool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a CognitoJwtVerifier and returns 401 when token is invalid', async () => {
    const mockVerify = jest.fn().mockRejectedValue(new Error('invalid token'));
    jest.mocked(CognitoJwtVerifier.create).mockReturnValue({
      verify: mockVerify,
    } as never);

    const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });
    const app = new App();
    app.use(bodyParser());
    app.use(
      createMcpRouter(mcpServer, {
        auth: {
          cognitoUserPool: {
            userPoolId: 'us-east-1_test',
            clientId: 'client123',
          },
        },
      }).routes()
    );

    const res = await request(app.callback())
      .post('/mcp')
      .send(makeMcpRequest('tools/call', { name: 'whoami', arguments: {} }, 1))
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .set('Authorization', 'Bearer bad-token');

    expect(res.status).toBe(401);
    expect(mockVerify).toHaveBeenCalledWith('bad-token');
  });

  test('creates a CognitoJwtVerifier and allows valid token', async () => {
    const payload = { sub: 'cognito-user', scope: 'openid' };
    const mockVerify = jest.fn().mockResolvedValue(payload);
    jest.mocked(CognitoJwtVerifier.create).mockReturnValue({
      verify: mockVerify,
    } as never);

    const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });
    const app = new App();
    app.use(bodyParser());
    app.use(
      createMcpRouter(mcpServer, {
        auth: {
          cognitoUserPool: {
            userPoolId: 'us-east-1_test',
            clientId: 'client123',
            tokenUse: 'access',
          },
        },
      }).routes()
    );

    const callback = app.callback();

    await request(callback)
      .post('/mcp')
      .send(makeMcpRequest('initialize', initializeParams, 1))
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .set('Authorization', 'Bearer valid-token');

    // A protected method exercises the Cognito verifier.
    const res = await request(callback)
      .post('/mcp')
      .send(makeMcpRequest('tools/call', { name: 'whoami', arguments: {} }, 2))
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(mockVerify).toHaveBeenCalledWith('valid-token');
  });

  test('passes tokenUse and clientId to CognitoJwtVerifier.create', () => {
    jest.mocked(CognitoJwtVerifier.create).mockReturnValue({
      verify: jest.fn(),
    } as never);

    const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });
    createMcpRouter(mcpServer, {
      auth: {
        cognitoUserPool: {
          userPoolId: 'us-east-1_abc',
          clientId: 'myclient',
          tokenUse: 'id',
        },
      },
    });

    expect(CognitoJwtVerifier.create).toHaveBeenCalledWith({
      tokenUse: 'id',
      userPoolId: 'us-east-1_abc',
      clientId: 'myclient',
    });
  });
});

// `getWwwAuthenticateHeader` and `createProtectedResourceMetadataMiddleware`
// live in @ttoss/auth-core / @ttoss/http-server-oauth and are tested there.
