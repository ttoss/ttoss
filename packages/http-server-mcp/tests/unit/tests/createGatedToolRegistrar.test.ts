import {
  createGatedToolRegistrar,
  type ToolCallContext,
  type ToolIdentity,
} from 'src/index';

type ToolCallResult = {
  isError?: true;
  content: Array<{ type: string; text: string }>;
};

type ToolCallback = (args: Record<string, unknown>) => Promise<unknown>;

/** Capture the callback passed to registerTool without spinning up a real server. */
const patchServer = () => {
  let capturedCallback: ToolCallback | undefined;
  const server = {
    registerTool: jest.fn(
      (_name: string, _config: unknown, callback: ToolCallback) => {
        capturedCallback = callback;
      }
    ),
  } as Parameters<typeof createGatedToolRegistrar>[0]['server'];

  const call = (
    args: Record<string, unknown> = {}
  ): Promise<ToolCallResult> => {
    if (!capturedCallback) throw new Error('registerTool not called');
    return capturedCallback(args) as Promise<ToolCallResult>;
  };

  return { server, call };
};

const makeIdentity = (overrides: Partial<ToolIdentity> = {}): ToolIdentity => {
  return { userId: 'user-1', scopes: ['read'], ...overrides };
};

describe('createGatedToolRegistrar', () => {
  describe('scope check', () => {
    test('returns isError result when required scope is missing; handler not called', async () => {
      const { server, call } = patchServer();
      const handler = jest.fn().mockResolvedValue({ ok: true });

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['other:scope'] });
        },
      });

      register({
        name: 'admin-tool',
        description: 'admin tool',
        requiredScope: 'admin',
        inputSchema: {},
        method: handler,
      });

      const result = await call({});
      expect(result.isError).toBe(true);
      expect(JSON.parse(result.content[0].text).error).toContain('admin');
      expect(handler).not.toHaveBeenCalled();
    });

    test('proceeds when required scope is present', async () => {
      const { server, call } = patchServer();
      const handler = jest.fn().mockResolvedValue({ success: true });

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['campaigns:read'] });
        },
      });

      register({
        name: 'list-campaigns',
        description: 'list campaigns',
        requiredScope: 'campaigns:read',
        inputSchema: {},
        method: handler,
      });

      const result = await call({});
      expect(result.isError).toBeUndefined();
      expect(handler).toHaveBeenCalled();
    });

    test('treats absent scopes (undefined) as empty — returns isError', async () => {
      const { server, call } = patchServer();
      const handler = jest.fn().mockResolvedValue({ ok: true });

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return { userId: 'user-1' } as ToolIdentity;
        },
      });

      register({
        name: 'scoped-tool',
        description: 'scoped',
        requiredScope: 'admin',
        inputSchema: {},
        method: handler,
      });

      const result = await call({});
      expect(result.isError).toBe(true);
      expect(handler).not.toHaveBeenCalled();
    });

    test('enforceScope: false skips the scope check', async () => {
      const { server, call } = patchServer();
      const handler = jest.fn().mockResolvedValue({ ok: true });

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return makeIdentity({ scopes: [] });
        },
        enforceScope: false,
      });

      register({
        name: 'unscoped-tool',
        description: 'unscoped',
        requiredScope: 'admin',
        inputSchema: {},
        method: handler,
      });

      const result = await call({});
      expect(result.isError).toBeUndefined();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('gates', () => {
    test('runs global gates in order; a throwing gate rejects the call', async () => {
      const order: string[] = [];
      const gateA = jest.fn(async () => {
        order.push('A');
      });
      const gateB = jest.fn(async () => {
        throw new Error('gate-B failed');
      });
      const gateC = jest.fn(async () => {
        order.push('C');
      });
      const handler = jest.fn().mockResolvedValue({ ok: true });

      const { server, call } = patchServer();

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['tools:run'] });
        },
        gates: [gateA, gateB, gateC],
      });

      register({
        name: 'guarded',
        description: 'guarded tool',
        requiredScope: 'tools:run',
        inputSchema: {},
        method: handler,
      });

      await expect(call({})).rejects.toThrow('gate-B failed');
      expect(order).toEqual(['A']); // gateC never ran
      expect(handler).not.toHaveBeenCalled();
    });

    test('gate receives full ToolCallContext (identity + args + handler name)', async () => {
      const receivedContexts: ToolCallContext[] = [];
      const identity = makeIdentity({ userId: 'alice', scopes: ['x'] });
      const callArgs = { campaignId: 99 };

      const { server, call } = patchServer();

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return identity;
        },
        gates: [
          (ctx) => {
            receivedContexts.push(ctx);
          },
        ],
      });

      register({
        name: 'id-tool',
        description: 'id tool',
        requiredScope: 'x',
        inputSchema: {},
        method: jest.fn().mockResolvedValue({}),
      });

      await call(callArgs);
      expect(receivedContexts).toHaveLength(1);
      expect(receivedContexts[0].identity).toEqual(identity);
      expect(receivedContexts[0].args).toEqual(callArgs);
      expect(receivedContexts[0].handler).toBe('id-tool');
    });

    test('per-def gates run after global gates and also receive ToolCallContext', async () => {
      const order: string[] = [];
      const identity = makeIdentity({ scopes: ['write'] });
      const callArgs = { isActive: true };

      const { server, call } = patchServer();

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return identity;
        },
        gates: [
          (ctx) => {
            order.push(`global:${ctx.handler}`);
          },
        ],
      });

      register({
        name: 'per-def-tool',
        description: 'per def gates',
        requiredScope: 'write',
        inputSchema: {},
        gates: [
          (ctx) => {
            order.push(`def:isActive=${String(ctx.args.isActive)}`);
          },
        ],
        method: jest.fn().mockResolvedValue({ ok: true }),
      });

      await call(callArgs);
      expect(order).toEqual(['global:per-def-tool', 'def:isActive=true']);
    });

    test('throwing per-def gate rejects the call; global gate already ran', async () => {
      const order: string[] = [];

      const { server, call } = patchServer();

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['write'] });
        },
        gates: [
          () => {
            order.push('global');
          },
        ],
      });

      register({
        name: 'blocked-tool',
        description: 'blocked',
        requiredScope: 'write',
        inputSchema: {},
        gates: [
          () => {
            throw new Error('per-def gate rejected');
          },
        ],
        method: jest.fn().mockResolvedValue({ ok: true }),
      });

      await expect(call({})).rejects.toThrow('per-def gate rejected');
      expect(order).toEqual(['global']);
    });

    test('arg-conditional per-def gate picks different predicate based on args', async () => {
      const activated: boolean[] = [];

      const { server, call } = patchServer();
      const identity = makeIdentity({ scopes: ['write'] });

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return identity;
        },
      });

      register({
        name: 'toggle',
        description: 'toggle',
        requiredScope: 'write',
        inputSchema: {},
        gates: [
          ({ args }) => {
            // simulate conditional logic — only flag which branch ran
            activated.push(args.isActive === true);
          },
        ],
        method: jest.fn().mockResolvedValue({ done: true }),
      });

      await call({ isActive: true });
      await call({ isActive: false });
      expect(activated).toEqual([true, false]);
    });
  });

  describe('buildContext', () => {
    test('buildContext output is merged into handler args', async () => {
      const handler = jest.fn().mockResolvedValue({ done: true });
      const { server, call } = patchServer();
      const identity = makeIdentity({ userId: 'bob', scopes: ['write'] });

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return identity;
        },
        buildContext: ({ identity: id }) => {
          return { tenantId: `tenant-${id.userId}` };
        },
      });

      register({
        name: 'ctx-tool',
        description: 'ctx tool',
        requiredScope: 'write',
        inputSchema: {},
        method: handler,
      });

      await call({ key: 'val' });
      expect(handler).toHaveBeenCalledWith({
        key: 'val',
        tenantId: 'tenant-bob',
      });
    });

    test('buildContext receives args so context can vary per call', async () => {
      const handler = jest.fn().mockResolvedValue({ done: true });
      const { server, call } = patchServer();

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['r'] });
        },
        buildContext: ({ args }) => {
          return { doubled: (args.n as number) * 2 };
        },
      });

      register({
        name: 'args-ctx-tool',
        description: 'args ctx',
        requiredScope: 'r',
        inputSchema: {},
        method: handler,
      });

      await call({ n: 5 });
      expect(handler).toHaveBeenCalledWith({ n: 5, doubled: 10 });
    });
  });

  describe('result shaping', () => {
    test('null result returns "Not found" error', async () => {
      const { server, call } = patchServer();

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['r'] });
        },
      });

      register({
        name: 'null-tool',
        description: 'null',
        requiredScope: 'r',
        inputSchema: {},
        method: async () => {
          return null;
        },
      });

      const result = await call({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Not found');
    });

    test('undefined result returns "Not found" error', async () => {
      const { server, call } = patchServer();

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['r'] });
        },
      });

      register({
        name: 'undef-tool',
        description: 'undef',
        requiredScope: 'r',
        inputSchema: {},
        method: async () => {
          return undefined;
        },
      });

      const result = await call({});
      expect(result.isError).toBe(true);
    });

    test('object result is JSON-wrapped in content', async () => {
      const { server, call } = patchServer();

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['r'] });
        },
      });

      register({
        name: 'obj-tool',
        description: 'obj',
        requiredScope: 'r',
        inputSchema: {},
        method: async () => {
          return { id: 42, name: 'widget' };
        },
      });

      const result = await call({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual({
        id: 42,
        name: 'widget',
      });
    });

    test('notFoundMessage overrides the default "Not found" text', async () => {
      const { server, call } = patchServer();

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['r'] });
        },
        notFoundMessage: 'Campaign not found',
      });

      register({
        name: 'custom-msg-tool',
        description: 'custom msg',
        requiredScope: 'r',
        inputSchema: {},
        method: async () => {
          return null;
        },
      });

      const result = await call({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Campaign not found');
    });
  });

  describe('onError', () => {
    test('handler throw triggers onError with full ToolCallContext, then rethrows', async () => {
      const onError = jest.fn();
      const error = new Error('handler-boom');
      const { server, call } = patchServer();
      const identity = makeIdentity({ userId: 'eve', scopes: ['admin'] });
      const callArgs = { payload: 'data' };

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return identity;
        },
        onError,
      });

      register({
        name: 'failing-tool',
        description: 'failing',
        requiredScope: 'admin',
        inputSchema: {},
        method: async () => {
          throw error;
        },
      });

      await expect(call(callArgs)).rejects.toThrow('handler-boom');
      expect(onError).toHaveBeenCalledWith(error, {
        identity,
        args: callArgs,
        handler: 'failing-tool',
      });
    });

    test('handler throw is rethrown directly when onError is not provided', async () => {
      const { server, call } = patchServer();

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['admin'] });
        },
      });

      register({
        name: 'no-hook-tool',
        description: 'no hook',
        requiredScope: 'admin',
        inputSchema: {},
        method: async () => {
          throw new Error('direct-rethrow');
        },
      });

      await expect(call({})).rejects.toThrow('direct-rethrow');
    });

    test('gate throw does NOT trigger onError', async () => {
      const onError = jest.fn();
      const { server, call } = patchServer();

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['x'] });
        },
        gates: [
          () => {
            throw new Error('gate-rejection');
          },
        ],
        onError,
      });

      register({
        name: 'gate-error-tool',
        description: 'gate error',
        requiredScope: 'x',
        inputSchema: {},
        method: jest.fn().mockResolvedValue({ ok: true }),
      });

      await expect(call({})).rejects.toThrow('gate-rejection');
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('default resolveIdentity', () => {
    test('falls back to getIdentity() from context when resolveIdentity is not provided', async () => {
      const { server, call } = patchServer();

      const { register } = createGatedToolRegistrar({ server });

      register({
        name: 'context-tool',
        description: 'context',
        requiredScope: 'r',
        inputSchema: {},
        method: jest.fn(),
      });

      // getIdentity() returns undefined outside an MCP request context →
      // clean Unauthorized isError result (not a raw TypeError)
      const result = await call({});
      expect(result.isError).toBe(true);
      expect(JSON.parse(result.content[0].text).error).toContain(
        'Unauthorized'
      );
    });
  });

  describe('undefined identity guard', () => {
    test('resolveIdentity returning undefined yields isError Unauthorized; handler not called', async () => {
      const { server, call } = patchServer();
      const handler = jest.fn().mockResolvedValue({ ok: true });

      const { register } = createGatedToolRegistrar({
        server,
        resolveIdentity: () => {
          return undefined as unknown as ReturnType<typeof makeIdentity>;
        },
      });

      register({
        name: 'unauthed-tool',
        description: 'unauthed',
        requiredScope: 'admin',
        inputSchema: {},
        method: handler,
      });

      const result = await call({});
      expect(result.isError).toBe(true);
      expect(JSON.parse(result.content[0].text).error).toContain(
        'Unauthorized'
      );
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
