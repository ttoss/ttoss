import { App, bodyParser, Router } from '@ttoss/http-server';
import {
  apiCall,
  ApiError,
  apiErrorResult,
  createMcpRouter,
  createToolGate,
  isApiError,
  McpServer,
  registerTools,
  type Tool,
} from 'src/index';
import request from 'supertest';

/**
 * A REST API answering `GET /fail/:status` with that status and the body
 * `bodies[status]`, or the envelope `{ error: { code: 'E<status>', ... } }`.
 */
const startRestServer = (
  bodies: Record<number, { type?: string; body: unknown }> = {}
): Promise<{ baseUrl: string; close: () => Promise<void> }> => {
  return new Promise((resolve) => {
    const restApp = new App();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const router = new Router<any, any>();
    router.get('/fail/:status', (ctx) => {
      const status = Number(ctx.params.status);
      const custom = bodies[status];
      ctx.status = status;
      if (custom?.type) ctx.type = custom.type;
      ctx.body = custom
        ? custom.body
        : {
            error: {
              code: `E${status}`,
              message: `Failed with ${status}.`,
              meta: { status },
            },
          };
    });
    restApp.use(bodyParser());
    restApp.use(router.routes());
    const server = restApp.listen(0, () => {
      const { port } = server.address() as { port: number };
      resolve({
        baseUrl: `http://localhost:${port}`,
        close: () => {
          return new Promise<void>((res, rej) => {
            server.close((err) => {
              return err ? rej(err) : res();
            });
          });
        },
      });
    });
  });
};

const failingTool: Tool = {
  name: 'fail',
  description: 'Calls an endpoint answering the given status.',
  inputSchema: {
    type: 'object',
    properties: { status: { type: 'number' } },
    required: ['status'],
  },
  outputSchema: {
    type: 'object',
    properties: { ok: { type: 'boolean' } },
    required: ['ok'],
  },
  handler: async ({ status }) => {
    const data = await apiCall('GET', `/fail/${status}`);
    return {
      content: [{ type: 'text', text: JSON.stringify(data) }],
      structuredContent: { ok: true },
    };
  },
};

const callTool = async ({
  baseUrl,
  tools,
  defer = false,
  name,
  args,
}: {
  baseUrl: string;
  tools: Tool[];
  defer?: boolean;
  name: string;
  args: Record<string, unknown>;
}) => {
  const server = new McpServer({ name: 'test', version: '1.0.0' });
  registerTools({ server, tools, defer });
  const app = new App();
  app.use(bodyParser());
  app.use(createMcpRouter(server, { apiBaseUrl: baseUrl }).routes());
  const res = await request(app.callback())
    .post('/mcp')
    .send({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name, arguments: args },
    })
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json, text/event-stream');
  return res.body.result as {
    isError?: boolean;
    content: { type: string; text: string }[];
    structuredContent?: Record<string, unknown>;
  };
};

let rest: Awaited<ReturnType<typeof startRestServer>>;

beforeAll(async () => {
  rest = await startRestServer({
    418: { body: { error: 'I am a teapot' } },
    502: { type: 'text/plain', body: 'upstream down' },
    503: { body: { error: 'x', meta: 'not an envelope' } },
    422: {
      body: {
        error: {
          code: 'TASK_DEPENDENCY_CYCLE',
          message: 'The link closes a cycle.',
          meta: { cycle: ['task_a', 'task_b'] },
          hint: 'Retract one blocks edge.',
          docs_url: 'https://example.com/errors#cycle',
        },
      },
    },
  });
});

afterAll(async () => {
  await rest.close();
});

describe('a failed REST answer as a tool result', () => {
  // Every status the envelope can come with: a result carrying the error as
  // text only fails here.
  test.each([
    400, 401, 402, 403, 404, 405, 408, 409, 410, 412, 413, 415, 429, 500, 501,
    504,
  ])(
    '%i carries status and the envelope as structuredContent',
    async (status) => {
      const result = await callTool({
        baseUrl: rest.baseUrl,
        tools: [failingTool],
        name: 'fail',
        args: { status },
      });

      expect(result.isError).toBe(true);
      expect(result.structuredContent).toEqual({
        status,
        error: {
          code: `E${status}`,
          message: `Failed with ${status}.`,
          meta: { status },
        },
      });
      // The line a model without structured content reads stays as it was.
      expect(result.content).toEqual([
        { type: 'text', text: `E${status}: Failed with ${status}.` },
      ]);
    }
  );

  test('copies the error object unchanged, hint and docs_url included', async () => {
    const result = await callTool({
      baseUrl: rest.baseUrl,
      tools: [failingTool],
      name: 'fail',
      args: { status: 422 },
    });

    expect(result.structuredContent).toEqual({
      status: 422,
      error: {
        code: 'TASK_DEPENDENCY_CYCLE',
        message: 'The link closes a cycle.',
        meta: { cycle: ['task_a', 'task_b'] },
        hint: 'Retract one blocks edge.',
        docs_url: 'https://example.com/errors#cycle',
      },
    });
  });

  test.each([
    [502, 'a non-JSON body', 'Bad Gateway'],
    [418, 'a string error', 'I am a teapot'],
    [503, 'an envelope-less body', 'x'],
  ])(
    '%i with %s answers isError with text and no structuredContent.error',
    async (status, _label, text) => {
      const result = await callTool({
        baseUrl: rest.baseUrl,
        tools: [failingTool],
        name: 'fail',
        args: { status },
      });

      expect(result.isError).toBe(true);
      expect(result.content).toEqual([{ type: 'text', text }]);
      expect(result.structuredContent).toEqual({ status });
    }
  );

  test('a deferred call carries the envelope too', async () => {
    const result = await callTool({
      baseUrl: rest.baseUrl,
      tools: [failingTool],
      defer: true,
      name: 'call',
      args: { name: 'fail', arguments: { status: 409 } },
    });

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      status: 409,
      error: { code: 'E409' },
    });
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'E409: Failed with 409.',
    });
  });

  test('a gated tool carries the envelope too', async () => {
    const gate = createToolGate({
      resolveIdentity: () => {
        return { userId: 'u', scopes: ['read'] };
      },
    });
    const result = await callTool({
      baseUrl: rest.baseUrl,
      tools: [gate({ tool: failingTool, requiredScope: 'read' })],
      name: 'fail',
      args: { status: 403 },
    });

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      status: 403,
      error: { code: 'E403' },
    });
  });

  test('any other error still answers text only', async () => {
    const result = await callTool({
      baseUrl: rest.baseUrl,
      tools: [
        {
          ...failingTool,
          handler: async () => {
            throw new Error('boom');
          },
        },
      ],
      name: 'fail',
      args: { status: 400 },
    });

    expect(result).toEqual({
      content: [{ type: 'text', text: 'boom' }],
      isError: true,
    });
  });
});

describe('ApiError', () => {
  test('apiCall throws it with the status and the parsed body', async () => {
    const error = await apiCall('GET', `${rest.baseUrl}/fail/400`).catch(
      (error_: unknown) => {
        return error_;
      }
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      name: 'ApiError',
      status: 400,
      body: { error: { code: 'E400' } },
    });
  });

  test('isApiError recognises it, and nothing else', () => {
    const error = new ApiError({ message: 'm', status: 409 });

    expect(isApiError(error)).toBe(true);
    expect(isApiError(new Error('m'))).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError('ApiError')).toBe(false);
  });

  test('apiErrorResult renders a hand-built one', () => {
    expect(
      apiErrorResult(
        new ApiError({
          message: 'FORBIDDEN: No.',
          status: 403,
          body: { error: { code: 'FORBIDDEN', message: 'No.' } },
        })
      )
    ).toEqual({
      content: [{ type: 'text', text: 'FORBIDDEN: No.' }],
      isError: true,
      structuredContent: {
        status: 403,
        error: { code: 'FORBIDDEN', message: 'No.' },
      },
    });
  });
});
