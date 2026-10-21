import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { Server as LowLevelServer } from '@modelcontextprotocol/server';
import { App, bodyParser } from '@ttoss/http-server';
import { createMcpRouter, InMemoryServerEventBus, McpServer } from 'src/index';
import { withoutChangeNotifications } from 'src/serveMcpRequest';

/**
 * `2026-07-28` `subscriptions/listen` streams, over a listening server: a
 * stream stays open by design, which is the one thing supertest cannot hold.
 */

// A server with a tool, because only a server advertising `tools` honours a
// subscription to their list changing.
const buildMcpServer = () => {
  const mcpServer = new McpServer({ name: 'test-server', version: '1.0.0' });
  mcpServer.registerTool('test-tool', { description: 'A test tool' }, () => {
    return { content: [{ type: 'text', text: 'ok' }] };
  });
  return mcpServer;
};

const listenBody = {
  jsonrpc: '2.0',
  id: 1,
  method: 'subscriptions/listen',
  params: {
    notifications: {
      toolsListChanged: true,
      promptsListChanged: true,
      resourcesListChanged: true,
      resourceSubscriptions: ['file:///any'],
    },
    _meta: {
      'io.modelcontextprotocol/protocolVersion': '2026-07-28',
      'io.modelcontextprotocol/clientCapabilities': {},
    },
  },
};

let server: Server | undefined;

afterEach(async () => {
  await new Promise<void>((resolve) => {
    if (!server?.listening) {
      resolve();
      return;
    }
    server.closeAllConnections();
    server.close(() => {
      resolve();
    });
  });
  server = undefined;
});

const start = async (
  options: Parameters<typeof createMcpRouter>[1] = {
    createMcpServer: buildMcpServer,
  }
) => {
  const router = createMcpRouter(buildMcpServer(), options);
  const app = new App();
  app.use(bodyParser());
  app.use(router.routes());

  server = createServer(app.callback());
  await new Promise<void>((resolve) => {
    server?.listen(0, resolve);
  });

  const { port } = server.address() as AddressInfo;

  return { router, url: `http://127.0.0.1:${port}/mcp` };
};

/**
 * Opens a listen stream and returns a reader of its `data:` frames, parsed,
 * plus whether the stream has ended.
 */
const listen = async (url: string) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'Mcp-Method': 'subscriptions/listen',
      'MCP-Protocol-Version': '2026-07-28',
    },
    body: JSON.stringify(listenBody),
  });

  const reader = (response.body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  let buffered = '';
  let ended = false;

  /** The next `data:` message, or `null` once the stream has ended. */
  const next = async (): Promise<{ method?: string; id?: number } | null> => {
    for (;;) {
      const frame = buffered.match(/^data: (.*)$/m);
      if (frame) {
        buffered = buffered.slice((frame.index ?? 0) + frame[0].length);
        return JSON.parse(frame[1]);
      }
      if (ended) {
        return null;
      }
      const chunk = await reader.read();
      if (chunk.done) {
        ended = true;
      } else {
        buffered += decoder.decode(chunk.value, { stream: true });
      }
    }
  };

  return { response, next };
};

describe('subscriptions/listen streams', () => {
  test('notify.toolsChanged reaches an open stream', async () => {
    const { router, url } = await start();
    const stream = await listen(url);

    expect(stream.response.headers.get('content-type')).toMatch(
      /text\/event-stream/
    );
    expect((await stream.next())?.method).toBe(
      'notifications/subscriptions/acknowledged'
    );

    router.notify.toolsChanged();

    expect((await stream.next())?.method).toBe(
      'notifications/tools/list_changed'
    );
  });

  test('close tells the stream the tools may have changed, then ends it', async () => {
    const { router, url } = await start();
    const stream = await listen(url);
    await stream.next();

    await router.close();

    expect((await stream.next())?.method).toBe(
      'notifications/tools/list_changed'
    );
    // The subscription's own result closes it, and then the stream ends.
    expect(await stream.next()).toMatchObject({ id: 1 });
    expect(await stream.next()).toBeNull();
  });

  // The deploy this exists for: `server.close()` waits for every open
  // request, and a listen stream never finishes on its own.
  test('after close, a graceful server.close() does not wait on the stream', async () => {
    const { router, url } = await start();
    const stream = await listen(url);
    await stream.next();

    await router.close();

    // A client reads its stream to the end, as any listening client does.
    while ((await stream.next()) !== null) {
      // drain
    }

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('server.close() was held open by the stream'));
      }, 2000);
      server?.close(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  });

  test('a supplied bus is the one notify publishes onto', async () => {
    const bus = new InMemoryServerEventBus();
    const published: string[] = [];
    bus.subscribe((event) => {
      published.push(event.kind);
    });

    const { router } = await start({ createMcpServer: buildMcpServer, bus });

    router.notify.toolsChanged();

    expect(published).toEqual(['tools_list_changed']);
  });

  test('without createMcpServer, notify and close have nothing to reach', async () => {
    const { router } = await start({});

    expect(() => {
      router.notify.toolsChanged();
      router.notify.promptsChanged();
      router.notify.resourcesChanged();
      router.notify.resourceUpdated('file:///nothing');
    }).not.toThrow();
    await expect(router.close()).resolves.toBeUndefined();
  });
});

// A host that buffers the response (AWS Lambda behind API Gateway) cannot
// deliver a stream that never ends: it holds the invocation to its timeout.
describe('streaming: false', () => {
  const buildFullServer = () => {
    const mcpServer = buildMcpServer();
    mcpServer.registerPrompt('test-prompt', { description: 'A prompt' }, () => {
      return { messages: [] };
    });
    mcpServer.registerResource('test-resource', 'file:///test', {}, () => {
      return { contents: [] };
    });
    return mcpServer;
  };

  test('a listen is acknowledged with nothing honoured, then completed', async () => {
    const { url } = await start({
      createMcpServer: buildFullServer,
      streaming: false,
    });
    const stream = await listen(url);

    expect(await stream.next()).toMatchObject({
      method: 'notifications/subscriptions/acknowledged',
      params: { notifications: {} },
    });
    expect(await stream.next()).toMatchObject({
      id: 1,
      result: { resultType: 'complete' },
    });
    expect(await stream.next()).toBeNull();
  });

  test('the shared 2025-era instance advertises no change notification either', () => {
    const shared = buildFullServer();
    createMcpRouter(shared, { streaming: false });

    expect(shared.server.getCapabilities()).toMatchObject({
      tools: { listChanged: false },
      prompts: { listChanged: false },
      resources: { listChanged: false, subscribe: false },
    });
  });

  test('by default the router leaves the capabilities as registered', () => {
    const shared = buildFullServer();
    createMcpRouter(shared, { createMcpServer: buildFullServer });

    expect(shared.server.getCapabilities().tools?.listChanged).toBe(true);
  });
});

describe('withoutChangeNotifications', () => {
  test('advertises no kind the server does not serve', () => {
    const capabilities =
      withoutChangeNotifications(buildMcpServer()).server.getCapabilities();

    expect(capabilities.tools).toEqual({ listChanged: false });
    expect(capabilities.prompts).toBeUndefined();
    expect(capabilities.resources).toBeUndefined();
  });

  // A factory may return the SDK's low-level `Server`, with no tools at all.
  test('takes a low-level Server, and leaves an absent tools capability absent', () => {
    const server = new LowLevelServer(
      { name: 'test-server', version: '1.0.0' },
      { capabilities: { prompts: { listChanged: true } } }
    );

    expect(withoutChangeNotifications(server).getCapabilities()).toEqual({
      prompts: { listChanged: false },
    });
  });
});
